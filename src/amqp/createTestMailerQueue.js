const createQueue = require('./createQueue')

module.exports = channel =>
  createQueue({
    routingKey: '#',
    exchangeKey: 'mailer',
    channel,
    handler: async function({ content }) {
      this.lastContent = content
    },
  })
