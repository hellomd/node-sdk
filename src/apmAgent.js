const apmNode = require('elastic-apm-node')

const { logger } = require('./logging')

const shouldUseApm = !!process.env.APM_TOKEN

let apmAgent = null

if (shouldUseApm) {
  apmAgent = apmNode.start({
    serviceName: process.env.PROJECT_NAME,
    secretToken: process.env.APM_TOKEN,
    serviceVersion: process.env.COMMIT_SHA1,
    captureExceptions: false,
    serverUrl:
      process.env.APM_URL ||
      'http://apm-server.monitoring.svc.cluster.local:8200',
    logger,
  })
}

module.exports = {
  apmAgent,
  shouldUseApm,
}
