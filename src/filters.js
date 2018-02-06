const convertStringToBoolean = value => (
  typeof value === 'undefined' || ['0', 'false'].includes(value) ? false : true
)

const createTransform = (ctx, queryKey) => {
  if (Array.isArray(ctx.query[queryKey])) {
    return v => ({ $in: v })
  }
  return v => v
}

const eq = (ctx, queryKey, dbKey = queryKey, transform = createTransform(ctx, queryKey)) => {
  if (typeof ctx.query[queryKey] !== 'undefined') {
    return {
      [dbKey]: transform(ctx.query[queryKey])
    }
  }
  return {}
}

const ne = (ctx, queryKey, dbKey = queryKey, transform = v => v) => (
  eq(ctx, queryKey, dbKey, v => ({ $ne: transform(v) }))
)

const bool = (ctx, queryKey, dbKey = queryKey, transform = v => v) => (
  eq(ctx, queryKey, dbKey, v => transform(convertStringToBoolean(v)))
)

const regExp = (ctx, queryKey, dbKey = queryKey, modifiers = 'i') => (
  eq(ctx, queryKey, dbKey, value => new RegExp(value, modifiers))
)

/**
 * @apiDefine PublishedFilter
 * @apiParam {Boolean} [published] Published filter e.g. /?published=true
 */
const published = ctx => eq(ctx, 'published', 'publishedAt', v => {
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