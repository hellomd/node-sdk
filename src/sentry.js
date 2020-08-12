const Sentry = require('@sentry/node')

const { logger } = require('./logging')

const { apmAgent, shouldUseApm } = require('./apmAgent')

const shouldUseSentry =
  typeof process.env.SENTRY_ENABLED !== 'undefined'
    ? process.env.SENTRY_ENABLED === 'true'
    : ['development', 'production'].includes(process.env.ENV)

const SENTRY_FATAL_ERROR_EXIT_TIMEOUT_MS =
  typeof process.env.SENTRY_FATAL_ERROR_EXIT_TIMEOUT_MS !== 'undefined'
    ? parseInt(process.env.SENTRY_FATAL_ERROR_EXIT_TIMEOUT_MS, 10)
    : 3000

// copied from
// https://github.com/getsentry/sentry-javascript/blob/7956bd84fac447005682192a04e29aaa95172554/packages/node/src/handlers.ts#L430-L453
const logAndExit = (error) => {
  logger.error('Sentry caught a fatal error', {
    error,
  })

  const client = Sentry.getCurrentHub().getClient()

  if (client === undefined) {
    logger.warning('No NodeClient was defined, we are exiting the process now.')
    global.process.exit(1)
    return
  }

  client
    .close(SENTRY_FATAL_ERROR_EXIT_TIMEOUT_MS)
    .then((result) => {
      if (!result) {
        logger.warning(
          'We reached the timeout for emptying the request buffer, still exiting now!',
        )
      }
      global.process.exit(1)
    })
    .then(null, (e) => {
      logger.error('Error while closing Sentry client', { error: e })
    })
}

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

          logAndExit(error)
        },
      )
    } else {
      logAndExit(error)
    }
  },
})

Sentry.setTags({
  project: process.env.PROJECT_NAME,
  clusterRegion: process.env.CLUSTER_REGION,
  projectResource: process.env.PROJECT_RESOURCE,
})

module.exports = {
  Sentry,
  shouldUseSentry,
}
