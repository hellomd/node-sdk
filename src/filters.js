const { toArray } = require('./utils')

const convertStringToBoolean = value =>
  typeof value === 'undefined' || ['0', 'false'].includes(value) ? false : true

const eq = (ctx, queryKey, dbKey = queryKey, transform = v => v) => {
  if (typeof ctx.query[queryKey] !== 'undefined') {
    return {
      [dbKey]: transform(ctx.query[queryKey]),
    }
  }
  return {}
}

const escapeRegexp = str => (str + '').replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&')

const $in = (ctx, queryKey, dbKey = queryKey, transform = v => v) =>
  eq(ctx, queryKey, dbKey, v => ({ $in: transform(toArray(v)) }))

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
const published = ctx =>
  eq(ctx, 'published', 'publishedAt', v => {
    if (convertStringToBoolean(v)) {
      return { $ne: null }
    }
    return null
  })

module.exports = {
  eq,
  in: $in,
  ne,
  nin,
  bool,
  prefix,
  regExp,
  published,
}
