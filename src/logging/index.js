const R = require('ramda')
const winston = require('winston')

const hellomdFormatter = require('./formatter/hellomd')

const formatterStructured = winston.format.combine(
  winston.format.timestamp(),
  hellomdFormatter(),
)

const formatterDev = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
)

const isStructuredLoggingEnabled = process.env.ENABLE_STRUCTURED_LOGGING == '1'

const format = isStructuredLoggingEnabled ? formatterStructured : formatterDev

const transports = [new winston.transports.Console({ format })]

const logger = winston.createLogger({ transports })

const decorateMessage = (msg, ctx, options) => {
  return options.showRequestId ? `[${ctx.state.id}] ${msg}` : msg
}

// structured logging based on:
//  https://github.com/koajs/bunyan-logger
//  https://www.elastic.co/guide/en/beats/filebeat/current/exported-fields-nginx.html
const structuredLoggingMiddleware = async (options, ctx, next) => {
  const start = Date.now()

  const fields = {
    access: {
      remote_ip_list: ctx.ips,
      remote_ip: ctx.request.ip,
      request_id: ctx.state.id,
      // only for basic auth, no need for that
      // user_name:
      method: ctx.method,
      url: ctx.path,
      referrer: ctx.headers.referer || null,
      agent: ctx.headers['user-agent'] || null,
    },
  }

  try {
    await next()
  } catch (error) {
    const errorFields = {
      ...fields,
      response_time: Date.now() - start,
      response_code: error.status || 500,
    }

    logger.error(error.message, {
      koa: errorFields,
      nodejs: {
        error: {
          message: error.message,
          stack: error.stack,
        },
      },
    })

    throw error
  }

  const successFields = {
    ...fields,
    response_time: Date.now() - start,
    response_code: ctx.status,
  }

  logger.info(`${ctx.method} ${ctx.path}`, {
    koa: successFields,
  })
}

const devLoggingMiddleware = async (options, ctx, next) => {
  const start = Date.now()

  const attrs = {
    path: ctx.path,
    method: ctx.method,
    request_id: ctx.state.id,
    remote: ctx.request.ip,
    environment: process.env.ENV,
    application_name: process.env.APP_NAME,
  }

  const msg = `${attrs.method} ${attrs.path}`

  if (options.enableDoubleLogging) {
    logger.info(`<-- ${decorateMessage(msg, ctx, options)}`, attrs)
  }

  try {
    await next()
  } catch (err) {
    const errorAttrs = {
      ...attrs,
      time: Date.now() - start,
      status: err.status || 500,
    }
    const errorMsg = `xxx ${decorateMessage(msg, ctx, options)}| ${
      errorAttrs.time
    }ms | ${errorAttrs.status} ${err.body || err}`

    logger.error(errorMsg, errorAttrs)

    throw err
  }

  const attrsFinal = {
    ...attrs,
    time: Date.now() - start,
    status: ctx.status,
  }

  const finalMsg = `--> ${decorateMessage(msg, ctx, options)} | ${
    attrsFinal.time
  }ms | ${attrsFinal.status}`

  logger.info(finalMsg, attrs)
}

const koaMiddleware = (options = {}) => async (ctx, next) => {
  ctx.logger = logger

  if (isStructuredLoggingEnabled) {
    await structuredLoggingMiddleware(options, ctx, next)
  } else {
    await devLoggingMiddleware(options, ctx, next)
  }
}

module.exports = {
  koaMiddleware,
  logger,
}
