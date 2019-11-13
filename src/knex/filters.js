const {
  convertStringToBoolean,
  convertStringToNull,
  escapeSqlLikePatternMatching,
  toArray,
  validableFilter,
} = require('../utils')

const builder = definitions => {
  // knexBuilder is a knex obj
  //  see http://knexjs.org/#Builder-where
  return knexBuilder => {
    for (const definition of definitions) {
      if (!definition) continue

      if (typeof definition === 'function') {
        definition(knexBuilder)
      } else if (!Array.isArray(definition) && typeof definition === 'object') {
        knexBuilder.where(definition)
      } else {
        throw new Error(
          'Invalid filter definition, must be a list of functions/objects',
        )
      }
    }

    return knexBuilder
  }
}

const negate = definitions => {
  // knexBuilder is a knex obj
  //  see http://knexjs.org/#Builder-where
  return knexBuilder => {
    for (const definition of definitions) {
      if (!definition) continue

      if (typeof definition === 'function') {
        knexBuilder.whereNot(knexBuilderInternal =>
          definition(knexBuilderInternal),
        )
      } else if (!Array.isArray(definition) && typeof definition === 'object') {
        knexBuilder.whereNot(definition)
      } else {
        throw new Error(
          'Invalid filter definition, must be a list of functions/objects',
        )
      }
    }

    return knexBuilder
  }
}

const eq = (ctx, queryKey, dbKey = queryKey, transform = v => v) => {
  if (typeof ctx.query[queryKey] !== 'undefined') {
    const transformedValue = transform(convertStringToNull(ctx.query[queryKey]))

    return knexBuilder =>
      transformedValue === null
        ? knexBuilder.whereNull(dbKey)
        : knexBuilder.where(dbKey, transformedValue)
  }
  return null
}

const bool = (ctx, queryKey, dbKey = queryKey, transform = v => v) => {
  const eqFn = eq(ctx, queryKey, dbKey, v =>
    transform(convertStringToBoolean(v)),
  )

  return eqFn
}

const $in = (ctx, queryKey, dbKey = queryKey, transform = v => v) => {
  if (typeof ctx.query[queryKey] !== 'undefined') {
    const transformedValues = transform(
      toArray(convertStringToNull(ctx.query[queryKey])),
    )

    if (!Array.isArray(transformedValues)) {
      // ctx.throw(422, 'Invalid filter param', { errors: { [queryKey]: ['Param must be an array'] }})
      throw new Error(
        'Invalid transformation, filter value after transform must be array',
      )
    }

    const hasNullValue = transformedValues.some(v => v === null)
    const transformedValuesNonNull = transformedValues.filter(v => v !== null)

    return knexBuilder => {
      knexBuilder.where(knexBuilderInternal => {
        knexBuilderInternal.whereIn(dbKey, transformedValuesNonNull)

        if (hasNullValue) knexBuilderInternal.orWhereNull(dbKey)
      })
    }
  }
  return null
}

const prefix = (ctx, queryKey, dbKey = queryKey, transform = v => v) => {
  if (typeof ctx.query[queryKey] !== 'undefined') {
    const escapeChar = '|'
    const transformedValue = transform(
      escapeSqlLikePatternMatching(ctx.query[queryKey], escapeChar),
    )
    return knexBuilder =>
      knexBuilder.whereRaw('?? like ? escape ?', [
        dbKey,
        `${transformedValue}%`,
        escapeChar,
      ])
  }
  return null
}

const inPrefix = (ctx, queryKey, dbKey = queryKey, transform = v => v) => {
  if (typeof ctx.query[queryKey] !== 'undefined') {
    const escapeChar = '|'

    const transformedValues = transform(toArray(ctx.query[queryKey]))

    if (!Array.isArray(transformedValues)) {
      // ctx.throw(422, 'Invalid filter param', { errors: { [queryKey]: ['Param must be an array'] }})
      throw new Error(
        'Invalid transformation, filter value after transform must be array',
      )
    }

    if (!transformedValues.length) return

    const transformedValuesEscaped = transformedValues.map(v =>
      escapeSqlLikePatternMatching(v, escapeChar),
    )

    // per https://stackoverflow.com/a/38074246/710693
    return knexBuilder =>
      knexBuilder.whereRaw(
        `?? like any(array(${transformedValuesEscaped
          .map(_v => '?')
          .join(',')})) escape ?`,
        [dbKey, ...transformedValuesEscaped.map(v => `${v}%`), escapeChar],
      )
  }
  return null
}

const filters = {
  builder,
  negate,
  eq,
  bool,
  in: $in,
  prefix,
  inPrefix,
  // between,
  // dateRange,
  // inRegExp,
  // regExp,
  // published,
}

for (const filterKey of Object.keys(filters)) {
  filters[filterKey] = validableFilter(filters[filterKey])
}

module.exports = filters
