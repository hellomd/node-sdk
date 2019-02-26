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

  function setup({ app, collections }) {
    beforeAll(async () => {
      const rabbit = await amqp.connect(AMQP_URL)
      const channel = await rabbit.createChannel()
      const mongoOpts = { useNewUrlParser: true }
      const dbConn = await MongoClient.connect(MONGO_URL, mongoOpts)
      const testQueue = await createTestQueue(channel)
      const testMailerQueue = await createTestMailerQueue(channel)
      const authUserId = ObjectId().toString()

      const appCallback = app({ channel, dbConn }).callback()

      global.hmd = {
        authn,
        authz,
        auth: authn(authUserId),
        authUserId,
        rabbit,
        channel,
        dbConn,
        testQueue,
        testMailerQueue,
        db: mapCollections(dbConn, collections),
        app: appCallback,
        request: request(appCallback),
        onPermit: (method, resource) =>
          authz.onPermit(authUserId, method, resource),
      }
    })

    afterEach(async () => {
      await global.hmd.testQueue.purge()
      await global.hmd.testMailerQueue.purge()

      const keys = Object.keys(global.hmd.db)
      for (let i = 0; i < keys.length; i++) {
        await global.hmd.db[keys[i]].deleteMany({})
      }
    })

    afterAll(async () => {
      await global.hmd.dbConn.close()
      await global.hmd.rabbit.close()
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
