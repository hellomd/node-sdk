if (!process.env.ENV || process.env.ENV === 'local') {
  require('dotenv').config()
}

const { MongoClient } = require('mongodb')

const { mapCollections } = require('../mongo')

const { createLoggerWithMetadata } = require('../logging')

const sleep = timeMs => new Promise(resolve => setTimeout(resolve, timeMs))

async function runJob(
  cb,
  {
    name = process.env.JOB_NAME,
    shouldConnectToMongoDb = true,
    connectionStringMongoDb,
    collections,
  } = {},
) {
  let mongoConn = undefined

  if (shouldConnectToMongoDb) {
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

  const jobName = name || 'unnamed-job'

  const logger = createLoggerWithMetadata({
    kind: jobName,
  })

  try {
    logger.info(`Running job ${jobName}`)
    await cb({ mongoConn, mongoDb, logger })
    logger.info(`Finished running job ${jobName}`)
  } catch (error) {
    logger.error(`Got error while running job ${jobName}`, {
      error,
    })
    process.exit(1)
  } finally {
    logger.info(`Disconnecting from MongoDB on job ${jobName}`)
    !!mongoConn && (await mongoConn.close())
    logger.info(`Disconnected from MongoDB on job ${jobName}`)
  }

  logger.info(`Sleeping 5s before leaving ${jobName}`)
  await sleep(5000)
  logger.info(`Slept, leaving ${jobName}`)
  process.exit(0)
}

module.exports = {
  runJob,
}
