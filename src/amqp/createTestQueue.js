const createQueue = require('./createQueue')

module.exports = channel =>
  createQueue({
    routingKey: '#',
    exchangeKey: 'events',
    channel,
    handler: async function({ key, content }) {
      this.lastKey = key
      this.lastContent = content
    },
  })