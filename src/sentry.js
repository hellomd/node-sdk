if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== '') {
  const Raven = require('raven')

  Raven.config().install()

  module.exports = err => {
    Raven.captureException(err)
  }
} else {
  module.exports = err => {

  }
}

