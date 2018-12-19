const { combine, format } = require('winston')
const { MESSAGE } = require('triple-beam')
const jsonStringify = require('fast-safe-stringify')

const { jsonReplacer } = require('./utils')

// based on https://github.com/winstonjs/logform/blob/d9d41c5/logstash.js
module.exports = () =>
  combine(
    format.timestamp(),
    format.splat(),
    format.colorize(),
    format.printf(({ timestamp, level, message, ...info }) => {
      const msg = `${info.timestamp} ${info.level}: ${info.message}`
      if (!Object.keys(info).length) return msg

      return `${msg}\n${jsonStringify(info, jsonReplacer, 2)}`
    }),
  )
