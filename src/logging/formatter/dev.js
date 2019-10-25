const { format } = require('winston')
const jsonStringify = require('fast-safe-stringify')

const { jsonReplacer } = require('./utils')

// based on https://github.com/winstonjs/logform/blob/d9d41c5/logstash.js
module.exports = () =>
  format.combine(
    format.timestamp(),
    format.splat(),
    format.colorize(),
    format.printf(({ timestamp, level, message, splat: _splat, ...info }) => {
      const msg = `${timestamp} ${level}: ${message}`

      if (!info) return msg

      if (info.error && info.error.message && info.error.stack) {
        const { error } = info
        delete info.error

        const infoObj = jsonStringify(info, jsonReplacer, 2)

        if (infoObj !== '{}') {
          return `${msg}\n${error.stack}\n${jsonStringify(
            info,
            jsonReplacer,
            2,
          )}`
        } else {
          return `${msg}\n${error.stack}`
        }
      }

      if (info.warning && info.warning.message && info.warning.stack) {
        const { warning } = info
        delete info.warning

        const infoObj = jsonStringify(info, jsonReplacer, 2)

        if (infoObj !== '{}') {
          return `${msg}\n${warning.stack}\n${jsonStringify(
            info,
            jsonReplacer,
            2,
          )}`
        } else {
          return `${msg}\n${warning.stack}`
        }
      }

      const infoObj = jsonStringify(info, jsonReplacer, 2)

      if (infoObj !== '{}') {
        return `${msg}\n${jsonStringify(info, jsonReplacer, 2)}`
      } else {
        return `${msg}`
      }
    }),
  )
