const requestIdLib = require('koa-requestid')

const requestId = (options = {}) =>
  requestIdLib({
    expose: 'X-Request-Id',
    header: 'X-Request-Id',
    query: 'requestId',
    ...options,
  })

module.exports = {
  requestId,
}
