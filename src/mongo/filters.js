const {
  convertStringToBoolean,
  convertStringToNull,
  escapeRegexp,
  toArray,
  validableFilter,
} = require('../utils')

const eq = (ctx, queryKey, dbKey = queryKey, transform = v => v) => {
  if (typeof ctx.query[queryKey] !== 'undefined') {
    return {
      [dbKey]: transform(convertStringToNull(ctx.query[queryKey])),
    }
  }
  return {}
}

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

const between = (
  ctx,
  queryKeyPrefix,
  dbKey = queryKeyPrefix,
  $not = false,
  transform = v => v,
) => {
  const valueFrom = ctx.query[`${queryKeyPrefix}From`]
  const valueTo = ctx.query[`${queryKeyPrefix}To`]

  if (!valueFrom && !valueTo) {
    return {}
  }

  let criteria = {}

  if (valueFrom) {
    criteria.$gte = transform(valueFrom)
  }

  if (valueTo) {
    criteria.$lte = transform(valueTo)
  }

  if ($not) {
    criteria = {
      $not: criteria,
    }
  }

  return {
    [dbKey]: criteria,
  }
}

const dateRange = (ctx, queryKeyPrefix, dbKey = queryKeyPrefix, $not = false) =>
  between(ctx, queryKeyPrefix, dbKey, $not, v => new Date(v))

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

const filters = {
  between,
  dateRange,
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

for (const filterKey of Object.keys(filters)) {
  filters[filterKey] = validableFilter(filters[filterKey])
}

module.exports = filters
