const stoppable = require('stoppable')
const { promisify } = require('es6-promisify')

const logging = require('./logging')

const noopFn = async () => {}

function httpServer(server, options = {}) {
  const {
    logger = logging.logger,
    gracePeriod = process.env.GRACEFUL_SHUTDOWN_GRACE_PERIOD_MS,
    onShutdown = noopFn,
  } = options

  stoppable(server, gracePeriod)

  const asyncServerStop = promisify(server.stop).bind(server)

  const state = { isShuttingDown: false }

  async function cleanup(signal) {
    if (!state.isShuttingDown) {
      state.isShuttingDown = true
      try {
        logger.info('Gracefully shutting down service')
        logger.info('Stopping http server')
        await asyncServerStop()
        logger.info('Stopping resources')
        await onShutdown()
        process.removeListener('SIGTERM', cleanup)
        logger.info('Gracefully shutdown service')
        process.kill(process.pid, 'SIGTERM')
      } catch (error) {
        logger.error('Error during graceful shutdown', { error })
        process.exit(1)
      }
    }
  }

  process.on('SIGTERM', cleanup)
}

module.exports = {
  httpServer,
}
