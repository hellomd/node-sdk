const { format } = require('winston')
const { MESSAGE } = require('triple-beam')
const jsonStringify = require('fast-safe-stringify')

const { jsonReplacer } = require('./utils')

// based on https://github.com/winstonjs/logform/blob/d9d41c5/logstash.js
module.exports = () =>
  format.combine(
    format.timestamp(),
    format.splat(),
    format.colorize(),
    format.printf(({ timestamp, level, message, meta, ...info }) => {
      const msg = `${timestamp} ${level}: ${message}`
      if (!meta) return msg

      if (meta.error && meta.error.message && meta.error.stack) {
        const { error } = meta
        delete meta.error

        return `${msg}\n${error.stack}\n${jsonStringify(meta, jsonReplacer, 2)}`
      }

      if (meta.warning && meta.warning.message && meta.warning.stack) {
        const { warning } = meta
        delete meta.warning

        return `${msg}\n${warning.stack}\n${jsonStringify(
          meta,
          jsonReplacer,
          2,
        )}`
      }

      return `${msg}\n${jsonStringify(meta, jsonReplacer, 2)}`
    }),
  )
