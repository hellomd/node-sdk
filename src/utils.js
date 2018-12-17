const crypto = require('crypto')

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

const randomString = async (length = 10) =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(length / 2, (error, buf) => {
      if (error) {
        return reject(error)
      }

      resolve(buf.toString('hex'))
    })
  })

const sample = arr => arr[randomInt(arr.length - 1)]

const toArray = value => [].concat(typeof value === 'undefined' ? [] : value)

module.exports = {
  nullify,
  nullOrDateString,
  nullOrDate,
  nullOrObjectId,
  nullOrToString,
  times,
  randomInt,
  randomString,
  sample,
  toArray,
}
