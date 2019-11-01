const postgres = async (knex, config = {}) => {
  // Code "copied" from database-cleaner package
  const {
    schema = 'public',
    strategy = 'truncation',
    skipTables = ['schema_migrations'],
  } = config

  if (strategy !== 'deletion' && strategy !== 'truncation') {
    throw new Error('Invalid deletion strategy: ' + strategy)
  }

  const result = await knex.raw(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}' AND table_type = 'BASE TABLE';`,
  )
  const length = result.rows.length

  // The database is empty
  if (length === 0) {
    return
  }

  if (strategy === 'deletion') {
    for (const table of result.rows) {
      if (skipTables.includes(table['table_name'])) {
        await knex.raw(`DELETE FROM "${schema}"."${table['table_name']}"`)
      }
    }
  } else if (strategy === 'truncation') {
    const tableExpression = result.rows
      .filter(table => {
        return skipTables.includes(table['table_name'])
      })
      .map(table => {
        return `"${schema}"."${table['table_name']}"`
      })
      .join(', ')

    // no tables to truncate
    if (tableExpression) {
      await knex.raw(
        `TRUNCATE TABLE ${tableExpression} RESTART IDENTITY CASCADE`,
      )
    }
  }
}

const mongoDb = async db => {
  const keys = Object.keys(db)
  for (let i = 0; i < keys.length; i++) {
    await db[keys[i]].deleteMany({})
  }
}

module.exports = {
  mongoDb,
  postgres,
}
