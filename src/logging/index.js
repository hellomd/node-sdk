const R = require('ramda')
const winston = require('winston')

const hellomdFormatter = require('./formatter/hellomd')

const isStructuredLoggingEnabled = process.env.ENABLE_STRUCTURED_LOGGING == '1'

const isTesting = process.env.ENV === 'test' || process.env.NODE_ENV === 'test'

const createLogger = ({ format, ...options }) => {
  const transports = [
    new winston.transports.Console({
      format,
      // silent: isTesting,
    }),
  ]
  const logger = winston.createLogger({
    transports,
    ...options,
    level: isTesting ? 'error' : options.level,
  })
  return logger
}

const defaultLogger = isStructuredLoggingEnabled
  ? createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        hellomdFormatter(),
      ),
    })
  : createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
      ),
    })

const decorateMessage = (msg, ctx, options) => {
  return options.showRequestId ? `[${ctx.state.id}] ${msg}` : msg
}

// structured logging based on:
//  https://github.com/koajs/bunyan-logger
//  https://www.elastic.co/guide/en/beats/filebeat/current/exported-fields-nginx.html
const structuredLoggingMiddleware = async (options, ctx, next) => {
  // probably not the best idea, one logger per request
  const logger = createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      hellomdFormatter({ koaCtx: ctx }),
    ),
  })
  ctx.logger = logger

  // errors are logged on the error reporter
  await next()

  const diffTime = process.hrtime(ctx.requestTimeStart)
  const duration = diffTime[0] * 1000 + diffTime[1] / 1000000

  const fields = {
    access: {
      response_time: duration,
      response_code: ctx.status,
    },
  }

  logger.info(`${ctx.method} ${ctx.path}`, {
    koa: fields,
    kind: 'http.request',
    timestamp: ctx.requestDateTime,
  })

  ctx.logger = null
}

const devLoggingMiddleware = async (options, ctx, next) => {
  // probably not the best idea, one logger per request
  const logger = createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}`,
      ),
    ),
  })
  ctx.logger = logger

  const msg = `${ctx.method} ${ctx.path}`

  if (options.enableDoubleLogging) {
    logger.info(`<-- ${decorateMessage(msg, ctx, options)}`)
  }

  // error should be logged in the error reporter
  await next()

  const diffTime = process.hrtime(ctx.requestTimeStart)
  const duration = diffTime[0] * 1000 + diffTime[1] / 1000000

  const finalMsg = `--> ${decorateMessage(
    msg,
    ctx,
    options,
  )} | ${duration}ms | ${ctx.status}`

  logger.info(finalMsg)

  ctx.logger = null
}

const koaMiddleware = (options = {}) => async (ctx, next) => {
  ctx.requestTimeStart = process.hrtime()
  ctx.requestDateTime = new Date().toISOString()

  if (isStructuredLoggingEnabled) {
    await structuredLoggingMiddleware(options, ctx, next)
  } else {
    await devLoggingMiddleware(options, ctx, next)
  }
}

module.exports = {
  createLogger,
  isStructuredLoggingEnabled,
  koaMiddleware,
  logger: defaultLogger,
}
