const isJestRunning = require('./isJestRunning')

let MongoClient = null

try {
  const mongodb = require('mongodb')
  MongoClient = mongodb.MongoClient
  // eslint-disable-next-line no-empty
} catch (error) {}

let PgPool = null
try {
  const pg = require('pg')
  PgPool = pg.Pool
  // eslint-disable-next-line no-empty
} catch (error) {}

if (isJestRunning) {
  const amqp = require('amqplib')
  const request = require('supertest')

  const { createTestQueue, createTestMailerQueue } = require('../amqp')
  const authz = require('../authz')
  const { axiosMock } = require('../axios')
  const { mapCollections } = require('../mongo')
  const { authn } = require('../testHelpers')

  // const DatabaseCleaner = require('database-cleaner')

  const {
    AMQP_URL,
    MONGO_URL,
    PGHOST,
    PGPORT,
    PGDATABASE,
    PGUSER,
    PGPASSWORD,
  } = process.env

  // eslint-disable-next-line no-inner-declarations,no-unused-vars
  function cleanPostgres(db, callback, config) {
    var schema = config.postgresql.schema || 'public'
    var schemaPrefix = '"' + schema + '".'

    console.log('Running select tables')
    db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = '" +
        schema +
        "' AND table_type = 'BASE TABLE';",
      function(err, tables) {
        console.log('Ran select tables', { err, tables })
        if (err) return callback(err)

        var count = 0
        var length = tables.rows.length
        var skippedTables = config.postgresql.skipTables
        var strategy = config.postgresql.strategy || 'deletion'
        if (strategy !== 'deletion' && strategy !== 'truncation') {
          return callback(new Error('Invalid deletion strategy: ' + strategy))
        }

        if (length === 0) {
          // The database is empty
          return callback()
        }

        if (strategy === 'deletion') {
          tables.rows.forEach(function(table) {
            if (skippedTables.indexOf(table['table_name']) === -1) {
              db.query(
                'DELETE FROM ' + schemaPrefix + '"' + table['table_name'] + '"',
                function() {
                  count++

                  if (count >= length) {
                    callback()
                  }
                },
              )
            } else {
              count++
              if (count >= length) {
                callback()
              }
            }
          })
        } else if (strategy === 'truncation') {
          var tableExpression = tables.rows
            .filter(function(table) {
              return skippedTables.indexOf(table['table_name']) === -1
            })
            .map(function(table) {
              return schemaPrefix + '"' + table['table_name'] + '"'
            })
            .join(', ')

          // no tables to truncate
          if (!tableExpression) {
            return callback()
          }

          console.log('Running TRUCANTE')
          db.query(
            'TRUNCATE TABLE ' + tableExpression + ' RESTART IDENTITY CASCADE',
            function(err) {
              console.log('Ran TRUCANTE', { err })
              if (err) {
                return callback(err)
              }
              callback()
            },
          )
        }
      },
    )
  }

  // eslint-disable-next-line no-inner-declarations
  function setup({
    app,
    collections,
    hasRabbit = true,
    hasMongoDb = false,
    hasPostgres = true,
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

      const pgConn = hasPostgres
        ? PgPool({
            host: PGHOST,
            port: PGPORT,
            database: PGDATABASE,
            user: PGUSER,
            password: PGPASSWORD,
            // we must keep it at 1 to allow for the transactiosn on beforeEach / afterEach to work
            min: 1,
            max: 1,
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

      global.pgConn = pgConn
      global.pg = pgConn

      global.onPermit = (method, resource) =>
        authz.onPermit(authUserId, method, resource)

      const appCallback = app({ channel, mongoDbConn, pgConn }).callback()
      global.app = appCallback
      global.request = request(appCallback)
    })

    beforeEach(async () => {
      axiosMock.reset()

      // Does not work if there are transactions during the test
      // global.pgConn && (await global.pgConn.query('START TRANSACTION'))
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
      // Does not work if there are transactions during the test
      // global.pgConn && (await global.pgConn.query('ROLLBACK'))
      // if (global.pgConn) {
      //   await new Promise((resolve, reject) => {
      //     // const databaseCleaner = new DatabaseCleaner('postgres', {
      //     //   postgresql: {
      //     //     strategy: 'truncation',
      //     //     skipTables: [],
      //     //   },
      //     // })
      //     // databaseCleaner.clean(global.pgConn, error =>
      //     // cleanPostgres(
      //     //   global.pgConn,
      //     //   error => (error ? reject(error) : resolve()),
      //     //   {
      //     //     postgresql: {
      //     //       strategy: 'truncation',
      //     //       skipTables: [],
      //     //     },
      //     //   },
      //     // )
      //   })
      // }
    })

    afterAll(async () => {
      global.mongoDbConn && (await global.mongoDbConn.close())
      global.rabbit && (await global.rabbit.close())
      global.pgConn && (await global.pgConn.end())
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
