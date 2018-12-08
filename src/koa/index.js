const requestIdLib = require('koa-requestid')

const { errorListener, errorMiddleware } = require('./errorReporter')
const { wrapper } = require('./wrapper')

const requestId = (options = {}) =>
  requestIdLib({
    expose: 'X-Request-Id',
    header: 'X-Request-Id',
    query: 'requestId',
    ...options,
  })

module.exports = {
  errorListener,
  errorMiddleware,
  requestId,
  wrapper,
}
