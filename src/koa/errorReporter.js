const { shouldUseApm } = require('../apmAgent')
const { Sentry, shouldUseSentry } = require('../sentry')
const { isTesting } = require('../isTesting')
const {
  logger: defaultLogger,
  isStructuredLoggingEnabled,
} = require('../logging')

function logRequestWithError(error, ctx) {
  const logger = ctx.logger || defaultLogger

  const diffTime = process.hrtime(ctx.requestTimeStart)
  const duration = diffTime[0] * 1000 + diffTime[1] / 1000000

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
      !isTesting || !error.status || error.status >= 500

    const httpErrorLevel =
      process.env.LOGGING_LEVEL_HTTP_ERRORS ||
      process.env.LOGGING_LEVEL_HTTP_ERRORS_TESTS ||
      'error'

    shouldLogHttpError && logger[httpErrorLevel](errorMsg)
  }
}

async function errorListener(error, ctx) {
  const logger = ctx.logger || defaultLogger

  if (!error.status || error.status > 499) {
    const user =
      (ctx.state &&
        ctx.state.user && {
          id: ctx.state.user.id,
          email: ctx.state.user.email,
          username: ctx.state.user.username,
        }) ||
      null

    shouldUseSentry &&
      Sentry.captureException(error, (scope) => {
        scope.setUser(user)
        scope.setTags({
          requestId: ctx.get('x-request-id'),
          transactionId: ctx.get('x-transaction-id'),
        })
      })

    shouldUseApm &&
      ctx.apmAgent &&
      ctx.apmAgent.captureError(
        error,
        {
          user,
          labels: {
            requestId: ctx.get('x-request-id'),
            transactionId: ctx.get('x-transaction-id'),
          },
        },
        (apmError, eventId) => {
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
        },
      )
  }
}

const errorMiddleware = () => async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    error.status = error.status || 500
    logRequestWithError(error, ctx)

    switch (error.status) {
      // validation error
      case 422:
        ctx.logger.warning('API Validation Error', {
          validationErrors: JSON.stringify(
            error.errors || error.message,
            null,
            2,
          ),
        })
        ctx.body = error.errors || error.message
        ctx.status = 422
        break
      default:
        ctx.body = error.expose
          ? error.message
          : error.status === 500 && process.env.ENV === 'production'
          ? 'Internal Server Error'
          : error.message
        ctx.status = error.status
        if (error.headers) {
          for (const [headerName, headerValue] of Object.entries(
            error.headers,
          )) {
            ctx.set(headerName, headerValue)
          }
        }
        ctx.app.emit('error', error, ctx)
    }
  }
}

module.exports = {
  errorListener,
  errorMiddleware,
}
