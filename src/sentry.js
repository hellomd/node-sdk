const Raven = require('raven')

Raven.config(process.env.SENTRY_DSN).install()

module.exports = err => {
  Raven.captureException(err)
}