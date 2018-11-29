const { format } = require('winston')
const { MESSAGE } = require('triple-beam')
const jsonStringify = require('fast-safe-stringify')

// based on https://github.com/winstonjs/logform/blob/d9d41c5/logstash.js
module.exports = format(info => {
  const obj = {
    environment: process.env.ENV,
    application_name: process.env.APP_NAME,
    ...info,
  }
  // if (info.message) {
  //   obj['@message'] = info.message;
  //   delete info.message;
  // }

  if (obj.timestamp) {
    obj['@timestamp'] = obj.timestamp
    delete info.timestamp
  }

  // obj['@fields'] = info
  info[MESSAGE] = jsonStringify(obj)
  return info
})
