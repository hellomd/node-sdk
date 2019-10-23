const isJestRunning = require('./isJestRunning')

if (isJestRunning) {
  const path = require('path')

  const amqp = require('amqplib')
  const request = require('supertest')
  const { MongoClient, ObjectId } = require('mongodb')

  const { createTestQueue, createTestMailerQueue } = require('../amqp')
  const authz = require('../authz')
  const { axiosMock } = require('../axios')
  const { mapCollections } = require('../mongo')
  const { authn } = require('../testHelpers')

  const { AMQP_URL, MONGO_URL } = process.env

  function setup({ app, collections, rabbitConnect = true }) {
    beforeAll(async () => {
      const rabbit = rabbitConnect ? await amqp.connect(AMQP_URL) : null
      const channel = rabbitConnect ? await rabbit.createChannel() : null
      const mongoOpts = { useNewUrlParser: true, useUnifiedTopology: true }
      const dbConn = await MongoClient.connect(MONGO_URL, mongoOpts)
      const testQueue = rabbitConnect ? await createTestQueue(channel) : null
      const testMailerQueue = rabbitConnect
        ? await createTestMailerQueue(channel)
        : null
      const authUserId = '5c754ba9b78dbd0036a766c1'

      global.authn = authn
      global.authz = authz
      global.auth = authn(authUserId)
      global.authUserId = authUserId
      global.rabbit = rabbit
      global.channel = channel
      global.dbConn = dbConn
      global.testQueue = testQueue
      global.testMailerQueue = testMailerQueue
      global.db = mapCollections(dbConn, collections)
      global.onPermit = (method, resource) =>
        authz.onPermit(authUserId, method, resource)

      const appCallback = app({ channel, dbConn }).callback()
      global.app = appCallback
      global.request = request(appCallback)
    })

    afterEach(async () => {
      global.testQueue && (await global.testQueue.purge())
      global.testMailerQueue && (await global.testMailerQueue.purge())

      const keys = Object.keys(global.db)
      for (let i = 0; i < keys.length; i++) {
        await global.db[keys[i]].deleteMany({})
      }
    })

    afterAll(async () => {
      global.dbConn && (await global.dbConn.close())
      global.rabbit && (await global.rabbit.close())
    })

    beforeEach(() => {
      axiosMock.reset()
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
