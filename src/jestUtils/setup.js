const isJestRunning = require('./isJestRunning')

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

if (isJestRunning) {
  const amqp = require('amqplib')
  const request = require('supertest')
  const DatabaseCleaner = require('database-cleaner')

  const { createTestQueue, createTestMailerQueue } = require('../amqp')
  const authz = require('../authz')
  const { axiosMock } = require('../axios')
  const { mapCollections } = require('../mongo')
  const { authn } = require('../testHelpers')

  const {
    AMQP_URL,
    MONGO_URL,
    PGHOST,
    PGPORT,
    PGDATABASE,
    PGUSER,
    PGPASSWORD,
  } = process.env

  // eslint-disable-next-line no-inner-declarations
  function setup({
    app,
    collections,
    hasRabbit = true,
    hasMongoDb = false,
    hasKnex = true,
  }) {
    beforeAll(async () => {
      // RabbitMQ Related
      const rabbit = hasRabbit ? await amqp.connect(AMQP_URL) : null
      const channel = hasRabbit ? await rabbit.createChannel() : null
      const testQueue = hasRabbit ? await createTestQueue(channel) : null
      const testMailerQueue = hasRabbit
        ? await createTestMailerQueue(channel)
        : null

      // Database - MongoDB
      const mongoDbConn = hasMongoDb
        ? await MongoClient.connect(MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          })
        : null

      const knex = hasKnex
        ? knexInit({
            client: 'pg',
            connection: {
              host: PGHOST,
              port: PGPORT,
              database: PGDATABASE,
              user: PGUSER,
              password: PGPASSWORD,
            },
            pool: { min: 1, max: 1 },
          })
        : null

      // Auth
      const authUserId = '5c754ba9b78dbd0036a766c1'

      global.authn = authn
      global.authz = authz
      global.auth = authn(authUserId)
      global.authUserId = authUserId

      global.rabbit = rabbit
      global.channel = channel
      global.testQueue = testQueue
      global.testMailerQueue = testMailerQueue

      global.mongoDbConn = mongoDbConn
      global.mongoDb = mongoDbConn && mapCollections(mongoDbConn, collections)

      global.knex = knex

      global.onPermit = (method, resource) =>
        authz.onPermit(authUserId, method, resource)

      const appCallback = app({ channel, mongoDbConn, knex }).callback()
      global.app = appCallback
      global.request = request(appCallback)
    })

    beforeEach(async () => {
      axiosMock.reset()
    })

    afterEach(async () => {
      global.testQueue && (await global.testQueue.purge())
      global.testMailerQueue && (await global.testMailerQueue.purge())

      if (global.mongoDb) {
        const keys = Object.keys(global.mongoDb)
        for (let i = 0; i < keys.length; i++) {
          await global.mongoDb[keys[i]].deleteMany({})
        }
      }

      if (global.knex) {
        await new Promise((resolve, reject) => {
          const databaseCleaner = new DatabaseCleaner('postgresql', {
            postgresql: {
              strategy: 'truncation',
              skipTables: [],
            },
          })
          databaseCleaner.clean(global.knex.client.pool, error =>
            error ? reject(error) : resolve(),
          )
        })
      }
    })

    afterAll(async () => {
      global.mongoDbConn && (await global.mongoDbConn.close())
      global.rabbit && (await global.rabbit.close())
      global.knex && (await global.knex.destroy())
    })
  }

  module.exports = {
    setup,
  }
} else {
  module.exports = {
    setup: () => {},
  }
}
