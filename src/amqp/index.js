const createConsumer = require('./createConsumer')
const createPublisher = require('./createPublisher')
const createQueue = require('./createQueue')
const createTestQueue = require('./createTestQueue')
const exchanges = require('./exchanges')
const koaMiddleware = require('./koaMiddleware')

module.exports = {
  createConsumer,
  createPublisher,
  createQueue,
  createTestQueue,
  exchanges,
  koaMiddleware,
}