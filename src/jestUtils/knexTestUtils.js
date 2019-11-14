const knexTestUtils = {
  async knexRunWithoutFkTriggers(knex, table, fn, columns = []) {
    return knex.transaction(async trx => {
      const triggerNames =
        columns && columns.length
          ? columns.map(col => `"${table}_${col}_fkey"`).join(',')
          : 'ALL'
      await trx.raw(`ALTER TABLE ?? DISABLE TRIGGER ${triggerNames}`, [table])
      const data = await fn(trx)
      await trx.raw(`ALTER TABLE ?? ENABLE TRIGGER ${triggerNames}`, [table])
      return data
    })
  },

  async insertDataOnTable(table, data, options = {}) {
    const {
      returning = '*',
      shouldIgnoreFks = true,
      fkColumnsToIgnore,
      knex = global.knex,
    } = options

    const wrapper = shouldIgnoreFks
      ? knexTestUtils.knexRunWithoutFkTriggers
      : async (a, b, fn) => fn(knex)

    return wrapper(
      knex,
      table,
      async trx =>
        trx(table)
          .insert(data)
          .returning(returning),
      fkColumnsToIgnore,
    )
  },
}

module.exports = {
  knexTestUtils,
}
