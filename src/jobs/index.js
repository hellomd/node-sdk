const { MongoClient } = require('mongodb')

const { mapCollections } = require('../mongo')

const { createLoggerWithMetadata } = require('../logging')

async function runJob(
  cb,
  {
    name = process.env.JOB_NAME,
    shouldConnectToMongoDb = true,
    connectionStringMongoDb,
    collections,
  } = {},
) {
  if (!process.env.ENV || process.env.ENV === 'local') {
    require('dotenv').config()
  }

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
    !!mongoConn && (await mongoConn.close())
  }
}

module.exports = {
  runJob,
}
