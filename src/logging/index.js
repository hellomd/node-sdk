const R = require('ramda')
const winston = require('winston')

const hellomdFormatter = require('./formatter/hellomd')

const isStructuredLoggingEnabled = process.env.ENABLE_STRUCTURED_LOGGING == '1'

const createLogger = ({ format }) => {
  const transports = [new winston.transports.Console({ format })]
  const logger = winston.createLogger({ transports })
  return logger
}

const decorateMessage = (msg, ctx, options) => {
  return options.showRequestId ? `[${ctx.state.id}] ${msg}` : msg
}

// structured logging based on:
//  https://github.com/koajs/bunyan-logger
//  https://www.elastic.co/guide/en/beats/filebeat/current/exported-fields-nginx.html
const structuredLoggingMiddleware = async (options, ctx, next) => {
  const start = Date.now()

  // probably not the best idea, one logger per request
  const format = winston.format.combine(
    winston.format.timestamp(),
    hellomdFormatter({ ctx }),
  )
  const logger = createLogger({ format })
  ctx.logger = logger

  try {
    await next()
  } catch (error) {
    const fields = {
      access: {
        response_time: Date.now() - start,
        response_code: error.status || 500,
        // body_sent: {
        //   bytes: Buffer.byteLength(ctx.response.body),
        // },
      },
    }

    logger.error(error.message, {
      koa: fields,
      nodejs: {
        error: {
          message: error.message,
          stack: error.stack,
        },
      },
    })

    throw error
  }

  const fields = {
    access: {
      response_time: Date.now() - start,
      response_code: ctx.status,
      // body_sent: {
      //   bytes: Buffer.byteLength(ctx.response.body),
      // },
    },
  }

  logger.info(`${ctx.method} ${ctx.path}`, {
    koa: fields,
  })

  ctx.logger = null
}

const devLoggingMiddleware = async (options, ctx, next) => {
  const start = Date.now()

  // probably not the best idea, one logger per request
  const format = winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      info => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
  )
  const logger = createLogger({ format })
  ctx.logger = logger

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

  ctx.logger = null
}

const koaMiddleware = (options = {}) => async (ctx, next) => {
  if (isStructuredLoggingEnabled) {
    await structuredLoggingMiddleware(options, ctx, next)
  } else {
    await devLoggingMiddleware(options, ctx, next)
  }
}

module.exports = {
  koaMiddleware,
  createLogger,
}
