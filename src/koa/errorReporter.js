const raven = require('raven')

const { shouldUseApm } = require('../apmAgent')
const { isTesting } = require('../isTesting')
const {
  logger: defaultLogger,
  isStructuredLoggingEnabled,
} = require('../logging')

const shouldUseSentry = !!process.env.SENTRY_DSN

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
      kind: 'http.request',
      koa: fields,
      error: {
        message: error.message,
        stack: error.stack,
      },
    })
  } else {
    const errorMsg = `xxx ${ctx.method} ${ctx.path} | ${duration}ms | ${
      error.status
    } ${error.body || error}\n${error.stack}`

    const shouldLogHttpError =
      !isTesting || (!error.status || error.status >= 500)

    shouldLogHttpError && logger.error(errorMsg)
  }

  if (!error.status || error.status > 499) {
    const user =
      (ctx.state &&
        ctx.state.user && {
          id: ctx.state.user.id,
          email: ctx.state.user.email,
        }) ||
      null

    shouldUseSentry &&
      raven.captureException(
        error,
        {
          request: ctx.request,
          user,
        },
        (sentryError, eventId) => {
          if (sentryError) {
            logger.error('Error while reporting request error to Sentry', {
              error: sentryError,
              originalError: error,
            })
          } else {
            logger.info('Reported request error to Sentry', {
              eventId,
            })
          }
        },
      )

    shouldUseApm &&
      ctx.apmAgent &&
      ctx.apmAgent.captureError(error, { user }, (apmError, eventId) => {
        if (apmError) {
          logger.error('Error while reporting request error to APM', {
            error: apmError,
            originalError: error,
            eventId,
          })
        } else {
          logger.info('Reported request error to APM', {
            eventId,
          })
        }
      })
  }
}

const errorMiddleware = () => async (ctx, next) => {
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
