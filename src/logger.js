const R = require('ramda')
const winston = require('winston')

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
)

const logmaticEnabled = process.env.LOGMATIC_API_KEY && process.env.LOGMATIC_API_KEY !== ''

const transports = R.reject(R.isNil)([
  new winston.transports.Console({format}),
  logmaticEnabled ? new require('./logmatic')() : undefined,
])

const logger = winston.createLogger({transports})

const middleware = async (ctx, next) => {
  ctx.logger = logger
  const start = Date.now()
  await next()
  const attrs = {
    path: ctx.path,
    method: ctx.method,
    time: Date.now() - start,
    request_id: ctx.state.id,
    remote: ctx.request.ip,
    environment: process.env.ENV,
    application_name: process.env.APP_NAME,
    status: ctx.status,
  }
  const message = `${attrs.method} ${attrs.path} | ${attrs.time}ms | ${attrs.status}`
  logger.info(message, attrs)
}

module.exports = () => middleware