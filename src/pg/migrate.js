const path = require('path')

const rootProjectDir = path.resolve(require.main.filename)
// main generally is src/index.js÷, and migrations generally are located at migrations/
const defaultMigrationsDir = path.resolve(rootProjectDir, '..', 'migrations')
const defaultConfig = {
  database: process.env.PGDATABASE,
  host: process.env.PGHOST,
  port: process.env.PGPORT | 0,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
}

const migrate = async ({
  dbConfig = defaultConfig,
  logFn,
  migrationsDir = defaultMigrationsDir,
} = {}) => {
  // require is here so that we only throw error if we call the fn
  const { createDb, migrate: _migrate } = require('postgres-migrations')

  if (process.env.SKIP_MIGRATIONS && process.env.SKIP_MIGRATIONS === 'true') {
    logFn('Skipping migrations because env var was set')
    return
  }
  await createDb(dbConfig.database, dbConfig, {
    logger: logFn,
  })
  await _migrate(dbConfig, migrationsDir)
}

const logger = require('signale')
logger.info('Starting migration...')
migrate({ dbConfig: defaultConfig, logFn: logger.log })
  .then(() => {
    logger.info('Migration finished.')
  })
  .catch(error => {
    logger.error('Error running migration', { error })
    process.exit(1)
  })
module.exports = { migrate }
