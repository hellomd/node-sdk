const createQueue = require('./createQueue')

module.exports = channel =>
  createQueue({
    routingKey: '#',
    exchangeKey: 'events',
    channel,
    handler: async function({ key, content }) {
      this.events = { ...this.events, [key]: content }
      this.lastKey = key
      this.lastContent = content
    },
  })
