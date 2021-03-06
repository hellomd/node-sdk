const logging = require('../logging')

const { apmAgent } = require('../apmAgent')

const { errorListener, errorMiddleware } = require('./errorReporter')
const { fixIp } = require('./fixIp')
const { requestId } = require('./requestId')
const { wrapper } = require('./wrapper')

// Helpful middleware, that initializes other middlewares
const addMiddlewares = (app, options = { logging: {} }) => {
  // make apm available on context
  app.use(async (ctx, next) => {
    ctx.apmAgent = apmAgent

    return next()
  })

  // those come first
  app.use(fixIp())
  app.use(requestId())

  // now error reporting middleware, so errors are really caught
  app.use(errorMiddleware())

  // logging middleware comes now, so ctx.logger is made available
  app.use(logging.koaMiddleware(options && options.logging))
}

const updateContextMiddleware = () => async (ctx, next) => {
  if (ctx.apmAgent) {
    // add user data
    const user =
      (ctx.state &&
        ctx.state.user && {
          id: ctx.state.user.id,
          email: ctx.state.user.email,
        }) ||
      null

    ctx.apmAgent.setUserContext(user)
  }

  return next()
}

module.exports = {
  addMiddlewares,
  errorListener,
  errorMiddleware,
  updateContextMiddleware,
  fixIp,
  requestId,
  wrapper,
}
