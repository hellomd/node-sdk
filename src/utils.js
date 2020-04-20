const crypto = require('crypto')

const moment = require('moment')

let ObjectId = null
try {
  const mongodb = require('mongodb')
  ObjectId = mongodb.ObjectId
  // eslint-disable-next-line no-empty
} catch (error) {}

const convertStringToBoolean = value =>
  typeof value === 'undefined' || ['0', 'false'].includes(value) ? false : true

const convertStringToNull = value => (value === 'null' ? null : value)

const escapeRegexp = str => (str + '').replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&')
const escapeSqlLikePatternMatching = (str, escapeChar = '|') => {
  const regex = new RegExp(`[\\${escapeChar}_%]`, 'g')
  return (str + '').replace(regex, `${escapeChar}$&`)
}

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

const nullOrObjectId = v => {
  if (!ObjectId) throw new Error('mongodb is not installed')
  return v && ObjectId(v)
}

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

const randomArrayItem = array => {
  return array[randomInt(array.length)]
}

const shuffleArray = array => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i
const uuidV1Regex = /^[0-9A-F]{8}-[0-9A-F]{4}-1[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
const uuidV4Regex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i

const sample = arr => arr[randomInt(arr.length - 1)]

const sleep = timeMs => new Promise(resolve => setTimeout(resolve, timeMs))

const toArray = value => [].concat(typeof value === 'undefined' ? [] : value)

const isProd = process.env.ENV === 'production'
const isStaging = process.env.ENV === 'staging'
const isDev =
  process.env.ENV === 'development' || process.env.NODE_ENV === 'development'
const isLocal = !process.env.ENV || process.env.ENV === 'local'

const valueOrFunction = (value, ctx, args) =>
  typeof value === 'function' ? value(ctx, args) : value

const validableFilter = (validate, fn, filterOptions = {}) => (
  ctx,
  queryKey,
  dbKey = queryKey,
  ...args
) => {
  const { isArrayFilter = false } = filterOptions
  const options = args[args.length - 1]
  let argsFinal = args

  if (options && options.constraints) {
    const obj = isArrayFilter
      ? {
          ...ctx.query,
          [queryKey]:
            typeof ctx.query[queryKey] !== 'undefined'
              ? toArray(ctx.query[queryKey])
              : ctx.query[queryKey],
        }
      : ctx.query

    validate(ctx, obj, {
      [queryKey]: options.constraints,
    })

    argsFinal = args.slice(0, args.length - 1)
  }

  return fn(ctx, queryKey, dbKey, ...argsFinal)
}

module.exports = {
  convertStringToBoolean,
  convertStringToNull,
  escapeRegexp,
  escapeSqlLikePatternMatching,
  nullify,
  nullOrDateString,
  nullOrDate,
  nullOrObjectId,
  nullOrToString,
  times,
  randomInt,
  randomString,
  randomArrayItem,
  shuffleArray,
  uuidRegex,
  uuidV1Regex,
  uuidV4Regex,
  sample,
  sleep,
  toArray,
  isProd,
  isStaging,
  isDev,
  isLocal,
  validableFilter,
  valueOrFunction,
}
