const middleware = async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    switch (err.status) {
      case 422:
        ctx.body = err.errors
        ctx.status = 422
        break
      default:
        ctx.body = err.message
        ctx.status = err.status || 500
        ctx.app.emit('error', err, ctx)
    }
  }
}

module.exports = () => middleware
