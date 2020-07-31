const { format } = require('winston')
const jsonStringify = require('fast-safe-stringify')

const { jsonReplacer } = require('./utils')

// based on https://github.com/winstonjs/logform/blob/d9d41c5/logstash.js
module.exports = ({ metadata = {} } = {}) =>
  format.combine(
    format.timestamp(),
    format.splat(),
    format.colorize(),
    format.printf(({ timestamp, level, message, splat: _splat, ...info }) => {
      const msg = `${timestamp} ${level}: ${message}`

      const infoFinal = {
        ...info,
        ...metadata,
      }

      if (!Object.keys(infoFinal).length) return msg

      if (infoFinal.error && infoFinal.error.message && info.error.stack) {
        const { error } = infoFinal
        delete infoFinal.error

        const infoStringified = jsonStringify(infoFinal, jsonReplacer, 2)

        if (infoStringified !== '{}') {
          return `${msg}\n${error.stack}\n${infoStringified}`
        } else {
          return `${msg}\n${error.stack}`
        }
      }

      if (
        infoFinal.warning &&
        infoFinal.warning.message &&
        infoFinal.warning.stack
      ) {
        const { warning } = infoFinal
        delete infoFinal.warning

        const infoStringified = jsonStringify(infoFinal, jsonReplacer, 2)

        if (infoStringified !== '{}') {
          return `${msg}\n${warning.stack}\n${infoStringified}`
        } else {
          return `${msg}\n${warning.stack}`
        }
      }

      const infoStringified = jsonStringify(infoFinal, jsonReplacer, 2)

      if (infoStringified !== '{}') {
        return `${msg}\n${infoStringified}`
      } else {
        return `${msg}`
      }
    }),
  )
