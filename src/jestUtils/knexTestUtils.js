const knexTestUtils = {
  // https://stackoverflow.com/a/38113838/710693
  async knexRunWithoutTriggers(knex, table, fn) {
    return knex.transaction(async trx => {
      await trx.raw('ALTER TABLE ?? DISABLE TRIGGER ALL', [table])
      const data = await fn(trx)
      await trx.raw('ALTER TABLE ?? ENABLE TRIGGER ALL', [table])
      return data
    })
  },

  addBeforeAfterHooksToIgnoreTriggers() {
    global.beforeAll &&
      global.beforeAll(async () => {
        await global.knex.raw("SET session_replication_role = 'replica'")
      })
    global.afterAll &&
      global.afterAll(async () => {
        await global.knex.raw("SET session_replication_role = 'origin'")
      })
  },

  async insertDataOnTable(table, data, options = {}) {
    const {
      returning = '*',
      shouldIgnoreTriggers = true,
      knex = global.knex,
    } = options

    const wrapper = shouldIgnoreTriggers
      ? knexTestUtils.knexRunWithoutTriggers
      : async (a, b, fn) => fn(knex)

    return wrapper(knex, table, async trx =>
      trx(table)
        .insert(data)
        .returning(returning),
    )
  },
}

module.exports = {
  knexTestUtils,
}
