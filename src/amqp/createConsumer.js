const parseJson = content => {
  try {
    return JSON.parse(content)
  } catch (err) {}
}

module.exports = async ({ ctx = {}, channel, handler, queue }) => {
  const consumer = {}

  const { consumerTag } = await channel.consume(queue, async msg => {
    try {
      const { fields: { routingKey: key }, content } = msg
      await handler.bind(consumer)({ ctx, key, content: parseJson(content) })
      channel.ack(msg)
    } catch (err) {
      channel.reject(msg)
    }
  })

  consumer.cancel = () => channel.cancel(consumerTag)
  return consumer
}