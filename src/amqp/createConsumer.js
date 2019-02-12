const { createLoggerWithMetadata } = require('../logging')

const parseJson = content => {
  try {
    return JSON.parse(content)
  } catch (err) {}
}

module.exports = async ({ ctx = {}, channel, handler, queue }) => {
  const consumer = {}

  const { consumerTag } = await channel.consume(queue, async msg => {
    const {
      fields: { routingKey: key },
      content,
    } = msg

    if (ctx && !ctx.logger) {
      ctx.logger = createLoggerWithMetadata({
        kind: key,
        resource: 'queue',
      })
    }

    try {
      await handler.bind(consumer)({ ctx, key, content: parseJson(content) })
      channel.ack(msg)
    } catch (error) {
      ctx.logger.error('Error while calling queue event handler', { error })
      channel.reject(msg, false)
    }
  })

  consumer.cancel = () => channel.cancel(consumerTag)
  return consumer
}
