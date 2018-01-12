const middleware = async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    switch (err.status) {
      case 422:
        ctx.status = 422
        ctx.body = err.errors
        break
      default:
        ctx.status = err.status || 500
        ctx.body = err.message
        ctx.app.emit('error', err, ctx)
    }
  }
}

module.exports = () => middleware