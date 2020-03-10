const createQueue = require('./createQueue')

module.exports = async channel =>
  createQueue({
    routingKey: '#',
    exchangeKey: 'events',
    channel,
    handler: async function({ key, content }) {
      this.events = {
        ...this.events,
        [key]:
          this.events && this.events[key]
            ? [...this.events[key], content]
            : [content],
      }
      this.lastKey = key
      this.lastContent = content
    },
  })
