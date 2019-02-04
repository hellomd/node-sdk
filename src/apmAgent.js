const apmNode = require('elastic-apm-node')

const { logger } = require('./logging')

const shouldUseApm =
  !!process.env.ELASTIC_APM_ACTIVE && process.env.ELASTIC_APM_ACTIVE === 'true'

// we are using ELASTIC_APM_* env vars to configure some of the options
// if ELASTIC_APM_ACTIVE is false, start does nothing
const apmAgent = apmNode.start({
  captureExceptions: false,
  serverUrl: 'http://apm-server.monitoring.svc.cluster.local:8200',
  // every transaction is logged by default, this is overwritten by using the env var
  transactionSampleRate: 1,
  // metrics disabled, to reduce duplication, see https://github.com/elastic/apm-agent-nodejs/issues/835
  metricsInterval: 0,
  logger,
  active: shouldUseApm,
})

module.exports = {
  apmAgent,
  shouldUseApm,
}
