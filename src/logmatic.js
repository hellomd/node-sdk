const Transport = require('winston-transport')
const { axios } = require('./axios')

const logmaticUrl = `https://api.logmatic.io/v1/input/${process.env.LOGMATIC_API_KEY}`

class LogmaticTransport extends Transport {
  log(info, callback) {
    axios.post(logmaticUrl, info).then(() => callback())
  }
}

module.exports = LogmaticTransport