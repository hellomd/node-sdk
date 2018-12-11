const raven = require('raven')

const { logger } = require('../logging')

const { apmAgent, shouldUseApm } = require('../apmAgent')

const shouldUseSentry = !!process.env.SENTRY_DSN

// @TODO Migrate sentry to newest sdk https://docs.sentry.io/error-reporting/quickstart/?platform=node

const wrapper = cb => {
  global.process.on('unhandledRejection', function(reason, promise) {
    let currDone = 0
    let targetDone = +shouldUseApm + +shouldUseSentry

    // should we kill the process on unhandled promise rejections?
    // const exitIfDone = () => ++currDone >= targetDone ? global.process.exit(1) : 0;
    const exitIfDone = () => {}

    // first report error to sentry
    if (shouldUseSentry) {
      // Raven uses domains to set context
      // Code copied from:
      //  https://github.com/getsentry/sentry-javascript/blob/92e0149bcafbfcf15a9dd499c0f3081d57b3103c/packages/raven-node/lib/client.js#L125-L142
      const context = (promise.domain && promise.domain.sentryContext) || {}
      context.extra = context.extra || {}
      context.extra.unhandledPromiseRejection = true

      raven.captureException(reason, context, function(sentryError, eventId) {
        if (sentryError) {
          logger.error(
            'Error while reporting unhandled promise rejection to Sentry',
            {
              error: sentryError,
              originalError: reason,
              eventId,
            },
          )
        } else {
          logger.info('Reported unhandled promise rejection to Sentry', {
            eventId,
          })
        }
        exitIfDone()
      })
    }

    // now send error to apm
    if (shouldUseApm) {
      const errorMessage = (reason && reason.message) || reason
      // https://www.elastic.co/guide/en/apm/agent/nodejs/1.x/agent-api.html#apm-capture-error
      apmAgent.captureError(
        reason,
        { unhandledPromiseRejection: true },
        (apmError, eventId) => {
          ++currDone
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
          exitIfDone()
        },
      )
    }

    if (!shouldUseApm && !shouldUseSentry) {
      logger.error('Unhandled promise rejection', {
        error: {
          message: (reason && reason.message) || reason,
          stack: (reason && reason.stack) || null,
        },
      })
      exitIfDone()
    }
  })

  process.on('warning', warning => {
    logger.warn(warning)
  })

  if (!shouldUseSentry) {
    // when using sentry, the captured error is sent to apm on their callback
    //  here we have to specify one handler directly, since we disabled their default one.
    // Code copied from:
    //  https://github.com/elastic/apm-agent-nodejs/blob/50dbeecd593aaa3935db3de47ebb3da7dc6d0033/lib/agent.js#L350-L357
    shouldUseApm &&
      process.on('uncaughtException', error => {
        apmAgent.captureError(
          error,
          { uncaughtException: true },
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
    raven
      .config(process.env.SENTRY_DSN, {
        // https://docs.sentry.io/learn/releases/#releases-are-better-with-commits
        // Need to add the commit tag to our releases
        release: `${process.env.PROJECT_NAME}@${process.env.COMMIT_SHA1}`,
        environment: process.env.ENV || 'development',
        tags: {
          git_commit: process.env.COMMIT_SHA1,
          project: `${process.env.PROJECT_NAME}`,
        },
        // do not send events on development
        shouldSendCallback: () =>
          ['production', 'staging'].indexOf(process.env.ENV) !== -1,
      })
      .install((error, sentryError, eventId) => {
        if (sentryError) {
          logger.error(
            'Error while reporting unhandled promise rejection to Sentry',
            {
              error: sentryError,
              originalError: reason,
              eventId,
            },
          )
        } else {
          logger.info('Reported unhandled promise rejection to Sentry', {
            eventId,
          })
        }

        if (shouldUseApm) {
          apmAgent.captureError(
            error,
            { uncaughtException: true },
            (apmError, apmEventId) => {
              if (apmError) {
                logger.error(
                  'Error while reporting uncaught exception to APM',
                  {
                    error: apmError,
                    originalError: error,
                    eventId: apmEventId,
                  },
                )
              } else {
                logger.info('Reported uncaught exception to APM', {
                  eventId: apmEventId,
                })
              }

              global.process.exit(1)
            },
          )
        } else {
          global.process.exit(1)
        }
      })

    return raven.context(cb)
  }
}

module.exports = {
  apmAgent,
  wrapper,
}
