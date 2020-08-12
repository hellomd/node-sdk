const { logger } = require('../logging')

const { apmAgent, shouldUseApm } = require('../apmAgent')
const { Sentry, shouldUseSentry } = require('../sentry')

const wrapper = (cb) => {
  global.process.on('unhandledRejection', function (reason, promise) {
    // first report error to sentry
    if (shouldUseSentry) {
      // Based on:
      //  https://github.com/getsentry/sentry-javascript/blob/f8b134e1de03ed0a632898c20a1bc96ed0e21939/packages/node/src/integrations/onunhandledrejection.ts#L56
      const context = (promise.domain && promise.domain.sentryContext) || {}

      Sentry.withScope((scope) => {
        scope.setExtra('unhandledPromiseRejection', true)

        if (context.user) {
          scope.setUser(context.user)
        }
        if (context.tags) {
          scope.setTags(context.tags)
        }
        if (context.extra) {
          scope.setExtras(context.extra)
        }

        Sentry.captureException(reason, { originalException: promise })
      })
    }

    // now send error to apm
    if (shouldUseApm) {
      // https://www.elastic.co/guide/en/apm/agent/nodejs/1.x/agent-api.html#apm-capture-error
      apmAgent.captureError(
        reason,
        { unhandledPromiseRejection: true },
        (apmError, eventId) => {
          // ++currDone
          if (apmError) {
            logger.error(
              'Error while reporting unhandled promise rejection to APM',
              {
                error: apmError,
                originalError: reason,
                eventId,
              },
            )
          } else {
            logger.info('Reported unhandled promise rejection to APM', {
              eventId,
            })
          }
        },
      )
    }

    logger.error('Unhandled promise rejection', {
      error: {
        message: (reason && reason.message) || reason,
        stack: (reason && reason.stack) || null,
      },
    })
  })

  process.on('warning', (warning) => {
    logger.warning(warning.message, { warning })
  })

  if (!shouldUseSentry) {
    // when using sentry, the captured error is sent to apm on their callback
    //  here we have to specify one handler directly, since we disabled their default one.
    // Code copied from:
    //  https://github.com/elastic/apm-agent-nodejs/blob/50dbeecd593aaa3935db3de47ebb3da7dc6d0033/lib/agent.js#L350-L357
    shouldUseApm &&
      process.on('uncaughtException', (error) => {
        apmAgent.captureError(
          error,
          { labels: { uncaughtException: true }, uncaughtException: true },
          (apmError, eventId) => {
            if (apmError) {
              logger.error('Error while reporting uncaught exception to APM', {
                error: apmError,
                originalError: error,
                eventId,
              })
            } else {
              logger.info('Reported uncaught exception to APM', {
                eventId,
              })
            }

            global.process.exit(1)
          },
        )
      })

    return cb({
      apmAgent,
    })
  } else {
    // sentry handles this by default for us

    return cb({ apmAgent, Sentry })
  }
}

module.exports = {
  apmAgent,
  wrapper,
}
