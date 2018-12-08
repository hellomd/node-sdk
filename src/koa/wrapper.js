const raven = require('raven')

const { logger } = require('../logging')

const shouldUseSentry = !!process.env.SENTRY_DSN

const wrapper = cb => {
  if (!shouldUseSentry) {
    return cb()
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
      .install((err /*, initialErr, eventId*/) => {
        logger.error('Could not install Raven', { error: err })
        process.exit(1)
      })

    return raven.context(cb)
  }
}

module.exports = {
  wrapper,
}
