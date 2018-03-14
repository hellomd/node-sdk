const exchanges = require('./exchanges')
const createConsumer = require('./createConsumer')

module.exports = async ({
  routingKey,
  exchangeKey,
  handler,
  channel,
  options = { durable: true },
}) => {
  const queue = `q-sub-${exchangeKey}-${process.env.APP_NAME}-${routingKey}`
  const exchange = (await exchanges(channel))[exchangeKey]
  await channel.assertQueue(queue, options)
  await channel.bindQueue(queue, exchange, routingKey)

  return {
    check: () => channel.checkQueue(queue),
    purge: () => channel.purgeQueue(queue),
    newConsumer: async ctx =>
      createConsumer({
        ctx,
        queue,
        channel,
        handler,
      }),
  }
}
