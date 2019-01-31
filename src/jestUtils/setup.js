const path = require('path')

const amqp = require('amqplib')
const request = require('supertest')
const { MongoClient, ObjectId } = require('mongodb')

const {
  amqp: { createTestQueue, createTestMailerQueue },
  authz,
  axiosMock,
  mongo: { mapCollections },
  testHelpers: { authn },
} = require('../index')

const { AMQP_URL, MONGO_URL } = process.env

function setup({ app, collections }) {
  beforeAll(async () => {
    const rabbit = await amqp.connect(AMQP_URL)
    const channel = await rabbit.createChannel()
    const mongoOpts = { useNewUrlParser: true }
    const mongo = await MongoClient.connect(
      MONGO_URL,
      mongoOpts,
    )
    const testQueue = await createTestQueue(channel)
    const testMailerQueue = await createTestMailerQueue(channel)
    const authUserId = ObjectId().toString()
    global.authn = authn
    global.auth = authn(authUserId)
    global.rabbit = rabbit
    global.channel = channel
    global.mongo = mongo
    global.testQueue = testQueue
    global.testMailerQueue = testMailerQueue
    global.db = mapCollections(mongo, collections)
    global.app = app({ channel, db: mongo }).callback()
    global.request = request(global.app)
    global.onPermit = (method, resource) =>
      authz.onPermit(authUserId, method, resource)
  })

  afterEach(async () => {
    await global.testQueue.purge()
    await global.testMailerQueue.purge()

    const keys = Object.keys(global.db)
    for (let i = 0; i < keys.length; i++) {
      await global.db[keys[i]].deleteMany({})
    }
  })

  afterAll(async () => {
    await global.mongo.close()
    await global.rabbit.close()
  })

  beforeEach(() => {
    axiosMock.reset()
  })
}

module.exports = {
  setup,
}
