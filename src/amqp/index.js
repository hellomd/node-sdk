const createConsumer = require('./createConsumer')
const createPublisher = require('./createPublisher')
const createQueue = require('./createQueue')
const createTestQueue = require('./createTestQueue')
const createTestMailerQueue = require('./createTestMailerQueue')
const exchanges = require('./exchanges')
const koaMiddleware = require('./koaMiddleware')

module.exports = {
  createConsumer,
  createPublisher,
  createQueue,
  createTestQueue,
  createTestMailerQueue,
  exchanges,
  koaMiddleware,
}
