const path = require('path')

const { migrate } = require('../../pg')

const defaultMigrationDir = path.resolve(process.cwd(), 'migrations')

exports.command = 'pg-migrate [migrationsDir]'

exports.describe = 'runs postgres migrations'

exports.builder = function(yargs) {
  return yargs.positional('migrationsDir', {
    describe: 'directory with the migrations folder',
    default: defaultMigrationDir,
  })
}

exports.handler = function(argv) {
  const { logger, migrationsDir } = argv
  logger.info('Starting migration...')

  migrate({ logFn: logger.log, migrationsDir })
    .then(() => {
      logger.info('Migration finished.')
    })
    .catch(error => {
      logger.error('Error running migration', { error })
      process.exit(1)
    })
}
