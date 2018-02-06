const convertStringToBoolean = value =>
  typeof value === 'undefined' || ['0', 'false'].includes(value) ? false : true

const eq = (ctx, queryKey, dbKey = queryKey, transform = v => v) => {
  const value = ctx.query[queryKey]
  if (typeof value !== 'undefined') {
    return {
      [dbKey]: Array.isArray(value)
        ? { $in: transform(value) }
        : transform(value),
    }
  }
  return {}
}

const ne = (ctx, queryKey, dbKey = queryKey, transform = v => v) =>
  eq(ctx, queryKey, dbKey, v => ({ $ne: transform(v) }))

const bool = (ctx, queryKey, dbKey = queryKey, transform = v => v) =>
  eq(ctx, queryKey, dbKey, v => transform(convertStringToBoolean(v)))

const regExp = (ctx, queryKey, dbKey = queryKey, modifiers = 'i') =>
  eq(ctx, queryKey, dbKey, value => new RegExp(value, modifiers))

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
  ne,
  bool,
  regExp,
  published,
}
