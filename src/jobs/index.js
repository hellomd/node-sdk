if (!process.env.ENV || process.env.ENV === 'local') {
  require('dotenv').config()
}

let MongoClient = null
try {
  const mongodb = require('mongodb')
  MongoClient = mongodb.MongoClient
  // eslint-disable-next-line no-empty
} catch (error) {}

let knexInit = null
try {
  knexInit = require('knex')
  // eslint-disable-next-line no-empty
} catch (error) {}

const { apmAgent, shouldUseApm } = require('../apmAgent')
const { mapCollections } = require('../mongo')
const { createLoggerWithMetadata } = require('../logging')

const sleep = timeMs => new Promise(resolve => setTimeout(resolve, timeMs))

async function runJob(
  cb,
  {
    name = process.env.JOB_NAME,
    shouldConnectToMongoDb = false,
    shouldConnectToPg = true,
    connectionStringMongoDb,
    collections,
  } = {},
) {
  const trans = shouldUseApm && apmAgent.startTransaction(name, 'cronjob')

  let mongoConn = undefined

  if (shouldConnectToMongoDb) {
    if (!MongoClient) throw new Error('mongodb lib is not installed')
    mongoConn = await MongoClient.connect(
      connectionStringMongoDb || process.env.MONGO_URL,
      {
        useNewUrlParser: true,
      },
    )
  }

  let mongoDb = undefined

  if (mongoConn) {
    if (collections) {
      mongoDb = mapCollections(mongoConn, collections)
    } else {
      mongoDb = mongoConn.db()
    }
  }

  let knex = undefined
  if (shouldConnectToPg) {
    knex = knexInit({
      client: 'pg',
      asyncStackTraces:
        process.env.HMD_KNEX_ASYNCSTACKTRACE === 'true' ||
        ['development', 'local', undefined].includes(process.env.ENV),
      connection: {
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
      },
      // defaults to 2, 10
      pool: { min: 1, max: 2 },
      log: createLoggerWithMetadata({ kind: 'knex' }),
    })
  }

  const jobName = name || 'unnamed-job'

  const logger = createLoggerWithMetadata({
    kind: jobName,
  })

  let hasErrored = false

  try {
    logger.info(`Running job ${jobName}`)
    await cb({ knex, mongoConn, mongoDb, logger })
    logger.info(`Finished running job ${jobName}`)
  } catch (error) {
    logger.error(`Got error while running job ${jobName}`, {
      error,
    })
    hasErrored = true
  } finally {
    if (shouldConnectToMongoDb) {
      logger.info(`Disconnecting from MongoDB on job ${jobName}`)
      !!mongoConn && (await mongoConn.close())
      logger.info(`Disconnected from MongoDB on job ${jobName}`)
    }
    if (shouldConnectToPg) {
      logger.info(`Disconnecting from Postgres on job ${jobName}`)
      !!knex && (await knex.destroy())
      logger.info(`Disconnected from Postgres on job ${jobName}`)
    }
  }

  if (trans) {
    trans.result = hasErrored ? 'error' : 'success'
    trans.end()
  }

  logger.info(`Sleeping 2s before leaving ${jobName}`)
  await sleep(2000)
  logger.info(`Slept, leaving ${jobName}`)
  process.exit(hasErrored | 0)
}

module.exports = {
  runJob,
}
