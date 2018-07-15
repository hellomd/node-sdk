const moment = require('moment')
const { ObjectId } = require('mongodb')

const nullify = o =>
  Object.entries(o).reduce(
    (acc, [k, v]) => ({ ...acc, [k]: v === undefined ? null : v }),
    {},
  )

const nullOrDateString = v => v && v.toISOString()

const nullOrDate = v =>
  v &&
  moment(v, moment.iso8601, true)
    .utc()
    .toDate()

const nullOrObjectId = v => v && ObjectId(v)

const nullOrToString = v => v && v.toString()

const times = (n, fn) => Array.from(Array(n)).map((_, i) => fn(i))

const randomInt = (max = 100) => Math.floor(Math.random() * Math.floor(max))

const sample = arr => arr[randomInt(arr.length - 1)]

const toArray = value => [].concat(typeof value === 'undefined' ? [] : value)

const withRetry = async (fn, maxRetries = 1) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (err) {
      throw err
    }
  }
}

module.exports = {
  nullify,
  nullOrDateString,
  nullOrDate,
  nullOrObjectId,
  nullOrToString,
  times,
  randomInt,
  sample,
  toArray,
  withRetry,
}
