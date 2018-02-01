const getExchanges = require('./exchanges')

module.exports = async (channel, headers = {}) => {
  const exchanges = await getExchanges(channel)
  const publish = exchange => (key, data) =>
    channel.publish(
      exchange,
      key,
      Buffer.from(JSON.stringify(data), { headers }),
      {
        headers,
      },
    )

  return {
    publish,
    publishEvent: publish(exchanges.events),
    publishMailer: publish(exchanges.mailer),
  }
}