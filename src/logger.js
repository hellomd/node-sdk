const R = require('ramda')
const winston = require('winston')
const Logmatic = require('./logmatic')

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
)

const logmaticEnabled =
  process.env.LOGMATIC_API_KEY && process.env.LOGMATIC_API_KEY !== ''

const transports = R.reject(R.isNil)([
  new winston.transports.Console({ format }),
  logmaticEnabled ? new Logmatic() : undefined,
])

const logger = winston.createLogger({ transports })

const decorateMessage = (msg, ctx, options) => {
  return options.showRequestId ? `[${ctx.state.id}] ${msg}` : msg;
}

const middleware = (options = {}) => async (ctx, next) => {
  ctx.logger = logger
  const start = Date.now()

  const attrs = {
    path: ctx.path,
    method: ctx.method,
    request_id: ctx.state.id,
    remote: ctx.request.ip,
    environment: process.env.ENV,
    application_name: process.env.APP_NAME,
    '@marker': ['sourcecode'],
  }

  const msg = `${attrs.method} ${attrs.path}`;

  if (options.enableDoubleLogging) {
    logger.info(
      `<-- ${decorateMessage(msg, ctx, options)}`,
      attrs,
    )
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
    }ms | ${errorAttrs.status} ${err.body || err}`;
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

module.exports = middleware
