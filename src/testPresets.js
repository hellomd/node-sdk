let MongoClient = null
try {
  const mongodb = require('mongodb')
  MongoClient = mongodb.MongoClient
  // eslint-disable-next-line no-empty
} catch (error) {}

const amqp = require('amqplib')

const createPublisher = require('./amqp/createPublisher')
const createTestQueue = require('./amqp/createTestQueue')
const createTestMailerQueue = require('./amqp/createTestMailerQueue')
const mapCollections = require('./mongo/mapCollections')
const { axiosMock } = require('./axios')

const createWebPreset = createApp =>
  function() {
    before(async function() {
      this.channel = await this.rabbit.createChannel()
      this.testQueue = await createTestQueue(this.channel)
      this.testMailerQueue = await createTestMailerQueue(this.channel)
      this.app = createApp({
        channel: this.channel,
        db: this.dbConn,
        dbConn: this.dbConn,
      }).callback()
    })

    afterEach(async function() {
      await this.testQueue.purge()
    })

    after(async function() {
      await this.channel.close()
    })
  }

const consumerPreset = function() {
  beforeEach(async function() {
    this.channel = await this.rabbit.createChannel()
    this.publishEvent = (await createPublisher(this.channel)).publishEvent
  })

  afterEach(async function() {
    await this.channel.close()
  })
}

const basePreset = function(collections) {
  before(async function() {
    if (!MongoClient)
      throw new Error(
        'mongodb is not installed and is required for using legacy mocha tests',
      )
    this.dbConn = await MongoClient.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
    })
    this.db = mapCollections(this.dbConn, collections)
    this.rabbit = await amqp.connect(process.env.AMQP_URL)
  })

  after(async function() {
    await this.dbConn.close()
    await this.rabbit.close()
  })

  beforeEach(async function() {
    axiosMock.reset()
  })

  afterEach(async function() {
    const keys = Object.keys(this.db)
    for (let i = 0; i < keys.length; i++) {
      await this.db[keys[i]].deleteMany({})
    }
  })
}

module.exports = {
  basePreset,
  consumerPreset,
  createWebPreset,
}
