const raven = require('raven')

const {
  logger: defaultLogger,
  isStructuredLoggingEnabled,
} = require('../logging')

async function errorListener(error, ctx) {
  const logger = ctx.logger || defaultLogger

  const diffTime = process.hrtime(ctx.requestTimeStart)
  const duration = diffTime[0] * 1000 + diffTime[1] / 1000000

  error.status = error.status || 500

  if (isStructuredLoggingEnabled) {
    const fields = {
      access: {
        response_time: duration,
        response_code: error.status || 500,
      },
    }

    logger.error(error.message, {
      timestamp: ctx.requestDateTime,
      koa: fields,
      nodejs: {
        error: {
          message: error.message,
          stack: error.stack,
        },
      },
    })
  } else {
    const errorMsg = `xxx ${decorateMessage(
      msg,
      ctx,
      options,
    )}| ${duration}ms | ${error.status} ${error.body || error}`

    logger.error(errorMsg)
  }

  if ((!error.status || error.status > 499) && !!process.env.SENTRY_DSN) {
    raven.captureException(error, (sentryError, eventId) => {
      if (sentryError) {
        logger.error('Error while reporting error to Sentry', {
          error: sentryError,
          originalError: error,
        })
      } else {
        logger.info('Reported error to Sentry', {
          eventId,
        })
      }
    })
  }
}

async function errorMiddleware(ctx, next) {
  try {
    await next()
  } catch (error) {
    switch (error.status) {
      // validation error
      case 422:
        ctx.body = error.errors
        ctx.status = 422
        break
      default:
        // we are always exposing the error message to the client
        //  probably not great
        ctx.body = error.message
        ctx.status = error.status || 500
        ctx.app.emit('error', error, ctx)
    }
  }
}

module.exports = {
  errorListener,
  errorMiddleware,
}
