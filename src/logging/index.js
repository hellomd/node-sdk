// This file cannot depend on anything that has instrumenting via elastic-apm-node
// Otherwise the instrumenting is not going to work, since this file is required before
//  apm agent is started.
const winston = require('winston')

const { isTesting } = require('../isTesting')

const devFormatter = require('./formatter/dev')
const hellomdFormatter = require('./formatter/hellomd')

const { getUserFromCtxOrHeaderIfAny } = require('./utils')

const isStructuredLoggingEnabled =
  process.env.ENABLE_STRUCTURED_LOGGING === 'true'

const createLogger = ({ format, ...options }) => {
  const transports = [
    new winston.transports.Console({
      format,
    }),
  ]
  const logger = winston.createLogger({
    transports,
    // use syslog https://github.com/winstonjs/winston#logging-levels
    levels: winston.config.syslog.levels,
    ...options,
    level: isTesting ? 'error' : options.level || process.env.LOGGING_LEVEL,
  })
  return logger
}

const createLoggerWithMetadata = (metadata, options = {}) =>
  isStructuredLoggingEnabled
    ? createLogger({
        ...options,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.splat(),
          hellomdFormatter({ metadata }),
        ),
      })
    : createLogger({
        ...options,
        format: devFormatter(),
      })

const defaultLogger = createLoggerWithMetadata()

const decorateMessage = (msg, ctx, options) => {
  return options.showRequestId ? `[${ctx.state.id}] ${msg}` : msg
}

// structured logging based on:
//  https://github.com/koajs/bunyan-logger
//  https://www.elastic.co/guide/en/beats/filebeat/current/exported-fields-nginx.html
const structuredLoggingMiddleware = async (options, ctx, next) => {
  // we need to log user, even if the auth middleware was not added
  //  but the user still supplied the auth token
  const user = await getUserFromCtxOrHeaderIfAny(ctx)

  // probably not the best idea, one logger per request
  const logger = createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.splat(),
      hellomdFormatter({ koaCtx: ctx, user }),
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
    format: devFormatter(),
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
  createLoggerWithMetadata,
  hellomdFormatter,
  isStructuredLoggingEnabled,
  koaMiddleware,
  logger: defaultLogger,
}
