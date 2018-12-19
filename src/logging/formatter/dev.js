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

      return `${msg}\n${jsonStringify(meta, jsonReplacer, 2)}`
    }),
  )
