const R = require('ramda')
const winston = require('winston')
const Logmatic = require('./logmatic')

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
)

const logmaticEnabled = process.env.LOGMATIC_API_KEY && process.env.LOGMATIC_API_KEY !== ''

const transports = R.reject(R.isNil)([
  new winston.transports.Console({format}),
  logmaticEnabled ? new Logmatic() : undefined,
])

const logger = winston.createLogger({transports})

const middleware = async (ctx, next) => {
  ctx.logger = logger
  const start = Date.now()
  try {
    await next()
  } catch(err) {
    const attrs = {
      path: ctx.path,
      method: ctx.method,
      time: Date.now() - start,
      request_id: ctx.state.id,
      remote: ctx.request.ip,
      environment: process.env.ENV,
      application_name: process.env.APP_NAME,
      status: err.status || 500,
      '@marker': ['sourcecode']
    }
    const message = `${attrs.method} ${attrs.path} | ${attrs.time}ms | ${attrs.status} ${err.body || err}`
    logger.error(message, attrs)
    throw(err)
  }

  const attrs = {
    path: ctx.path,
    method: ctx.method,
    time: Date.now() - start,
    request_id: ctx.state.id,
    remote: ctx.request.ip,
    environment: process.env.ENV,
    application_name: process.env.APP_NAME,
    status: ctx.status,
    '@marker': ['sourcecode']
  }
  const message = `${attrs.method} ${attrs.path} | ${attrs.time}ms | ${attrs.status}`
  logger.info(message, attrs)
}

module.exports = () => middleware