const exchanges = {}

module.exports = async channel => {
  if (Object.keys(exchanges).length === 0) {
    const events = 'x-events'
    const mailer = 'x-mailer'
    await channel.assertExchange(events, 'topic', { durable: true })
    await channel.assertExchange(mailer, 'topic', { durable: true })
    exchanges.events = events
    exchanges.mailer = mailer
  }

  return exchanges
}