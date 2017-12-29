if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== '') {
  const Raven = require('raven')

  Raven.config().install()

  module.exports = err => {
    if (!err.status || err.status > 499) {
      Raven.captureException(err)
    }
  }
} else {
  module.exports = err => {

  }
}

