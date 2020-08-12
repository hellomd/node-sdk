const Sentry = require('@sentry/node')

const { logger } = require('./logging')

const { apmAgent, shouldUseApm } = require('./apmAgent')

const shouldUseSentry =
  typeof process.env.SENTRY_ENABLED !== 'undefined'
    ? process.env.SENTRY_ENABLED === 'true'
    : ['development', 'production'].includes(process.env.ENV)

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: shouldUseSentry,
  environment: process.env.ENV || 'undefined',
  logLevel:
    typeof process.env.SENTRY_LOG_LEVEL !== 'undefined'
      ? parseInt(process.env.SENTRY_LOG_LEVEL, 10)
      : 1,
  maxBreadcrumbs:
    typeof process.env.SENTRY_MAX_BREADCRUMBS !== 'undefined'
      ? parseInt(process.env.SENTRY_MAX_BREADCRUMBS, 10)
      : 15,
  release: `${process.env.PROJECT_NAME}@${process.env.COMMIT_SHA1}`,
  // we use elastic apm
  tracesSampleRate: 0,
  integrations(integrations) {
    const ignoredIntegrations = ['OnUnhandledRejection', 'Console']
    return integrations.filter(
      (integration) => !ignoredIntegrations.includes(integration.name),
    )
  },
  onFatalError(error) {
    if (shouldUseApm) {
      apmAgent.captureError(
        error,
        { labels: { uncaughtException: true }, uncaughtException: true },
        (apmError, apmEventId) => {
          if (apmError) {
            logger.error('Error while reporting uncaught exception to APM', {
              error: apmError,
              originalError: error,
              eventId: apmEventId,
            })
          } else {
            logger.info('Reported uncaught exception to APM', {
              eventId: apmEventId,
            })
          }

          process.nextTick(() => global.process.exit(1))
        },
      )
    } else {
      logger.error('Sentry caught a fatal error', {
        error,
      })
      process.nextTick(() => global.process.exit(1))
    }
  },
})

module.exports = {
  Sentry,
  shouldUseSentry,
}
