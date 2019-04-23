const { toArray } = require('./utils')

const convertStringToBoolean = value =>
  typeof value === 'undefined' || ['0', 'false'].includes(value) ? false : true

const convertStringToNull = value =>
  typeof value === 'undefined' || value === 'null' ? null : value

const eq = (ctx, queryKey, dbKey = queryKey, transform = v => v) => {
  return {
    [dbKey]: transform(convertStringToNull(ctx.query[queryKey])),
  }
}

const escapeRegexp = str => (str + '').replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&')

const $in = (ctx, queryKey, dbKey = queryKey, transform = v => v) =>
  eq(ctx, queryKey, dbKey, v => ({ $in: transform(toArray(v)) }))

const inRegExp = (ctx, queryKey, dbKey = queryKey, modifiers = 'i') =>
  $in(ctx, queryKey, dbKey, arr =>
    arr.map(v => new RegExp(escapeRegexp(v), modifiers)),
  )

const inPrefix = (ctx, queryKey, dbKey = queryKey, modifiers = 'i') =>
  $in(ctx, queryKey, dbKey, arr =>
    arr.map(v => new RegExp(`^${escapeRegexp(v)}`, modifiers)),
  )

const ne = (ctx, queryKey, dbKey = queryKey, transform = v => v) =>
  eq(ctx, queryKey, dbKey, v => ({ $ne: transform(v) }))

const nin = (ctx, queryKey, dbKey = queryKey, transform = v => v) =>
  eq(ctx, queryKey, dbKey, v => ({ $nin: transform(toArray(v)) }))

const bool = (ctx, queryKey, dbKey = queryKey, transform = v => v) =>
  eq(ctx, queryKey, dbKey, v => transform(convertStringToBoolean(v)))

const prefix = (ctx, queryKey, dbKey = queryKey) =>
  eq(ctx, queryKey, dbKey, value => new RegExp(`^${escapeRegexp(value)}`, 'i'))

const regExp = (ctx, queryKey, dbKey = queryKey, modifiers = 'i') =>
  eq(ctx, queryKey, dbKey, value => new RegExp(escapeRegexp(value), modifiers))

/**
 * @apiDefine PublishedFilter
 * @apiParam {Boolean} [published] Published filter e.g. /?published=true
 */
const published = (ctx, queryKey = 'published', dbKey = 'publishedAt') => {
  const value = ctx.query[queryKey]

  if (typeof value === 'undefined') {
    return {}
  }

  if (convertStringToBoolean(value)) {
    return { [dbKey]: { $ne: null, $lte: new Date() } }
  }

  return {
    $or: [
      {
        [dbKey]: null,
      },
      {
        [dbKey]: {
          $gt: new Date(),
        },
      },
    ],
  }
}

module.exports = {
  eq,
  in: $in,
  inRegExp,
  inPrefix,
  ne,
  nin,
  bool,
  prefix,
  regExp,
  published,
}
