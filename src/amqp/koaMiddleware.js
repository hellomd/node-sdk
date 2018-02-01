const createPublisher = require('./createPublisher')

module.exports = ({ channel }) => async (ctx, next) => {
  const { publishEvent, publishMailer } = await createPublisher(channel, {
    'X-Request-ID': ctx.state.id,
  })

  ctx.publishEvent = publishEvent
  ctx.publishMailer = publishMailer
  await next()
}
