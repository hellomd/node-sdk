const {
  convertStringToBoolean,
  convertStringToNull,
  escapeSqlLikePatternMatching,
  escapeRegexp,
  toArray,
  validableFilter,
} = require('../utils')

const { validate } = require('../validate')

const builder = (definitions) => {
  // knexBuilder is a knex obj
  //  see http://knexjs.org/#Builder-where
  return (knexBuilder) => {
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

const negate = (definitions) => {
  // knexBuilder is a knex obj
  //  see http://knexjs.org/#Builder-where
  return (knexBuilder) => {
    for (const definition of definitions) {
      if (!definition) continue

      if (typeof definition === 'function') {
        knexBuilder.whereNot((knexBuilderInternal) =>
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

const eq = (ctx, queryKey, dbKey = queryKey, transform = (v) => v) => {
  if (typeof ctx.query[queryKey] === 'undefined') {
    return null
  }
  const transformedValue = transform(convertStringToNull(ctx.query[queryKey]))

  return (knexBuilder) =>
    transformedValue === null
      ? knexBuilder.whereNull(dbKey)
      : knexBuilder.where(dbKey, transformedValue)
}

const operator = (knex, dbKey, op, val) => {
  return knex.where(dbKey, op, val)
}

const gt = (ctx, queryKey, dbKey = queryKey, transform = (v) => v) => {
  if (typeof ctx.query[queryKey] === 'undefined') {
    return null
  }
  const transformedValue = transform(ctx.query[queryKey])

  return (knexBuilder) => operator(knexBuilder, dbKey, '>', transformedValue)
}

const gte = (ctx, queryKey, dbKey = queryKey, transform = (v) => v) => {
  if (typeof ctx.query[queryKey] === 'undefined') {
    return null
  }
  const transformedValue = transform(ctx.query[queryKey])

  return (knexBuilder) => operator(knexBuilder, dbKey, '>=', transformedValue)
}

const lt = (ctx, queryKey, dbKey = queryKey, transform = (v) => v) => {
  if (typeof ctx.query[queryKey] === 'undefined') {
    return null
  }
  const transformedValue = transform(ctx.query[queryKey])

  return (knexBuilder) => operator(knexBuilder, dbKey, '<', transformedValue)
}

const lte = (ctx, queryKey, dbKey = queryKey, transform = (v) => v) => {
  if (typeof ctx.query[queryKey] === 'undefined') {
    return null
  }
  const transformedValue = transform(ctx.query[queryKey])

  return (knexBuilder) => operator(knexBuilder, dbKey, '<=', transformedValue)
}

const bool = (ctx, queryKey, dbKey = queryKey, transform = (v) => v) => {
  const eqFn = eq(ctx, queryKey, dbKey, (v) =>
    transform(convertStringToBoolean(v)),
  )

  return eqFn
}

const $in = (ctx, queryKey, dbKey = queryKey, transform = (v) => v) => {
  if (typeof ctx.query[queryKey] === 'undefined') {
    return null
  }
  const transformedValues = transform(
    toArray(convertStringToNull(ctx.query[queryKey])),
  )

  if (!Array.isArray(transformedValues)) {
    // ctx.throw(422, 'Invalid filter param', { errors: { [queryKey]: ['Param must be an array'] }})
    throw new Error(
      'Invalid transformation, filter value after transform must be array',
    )
  }

  const hasNullValue = transformedValues.some((v) => v === null)
  const transformedValuesNonNull = transformedValues.filter((v) => v !== null)

  return (knexBuilder) => {
    knexBuilder.where((knexBuilderInternal) => {
      knexBuilderInternal.whereIn(dbKey, transformedValuesNonNull)

      if (hasNullValue) knexBuilderInternal.orWhereNull(dbKey)
    })
  }
}

const prefix = (ctx, queryKey, dbKey = queryKey, transform = (v) => v) => {
  if (typeof ctx.query[queryKey] === 'undefined') {
    return null
  }
  const escapeChar = '|'
  const transformedValue = transform(
    escapeSqlLikePatternMatching(ctx.query[queryKey], escapeChar),
  )
  return (knexBuilder) =>
    knexBuilder.whereRaw(`?? like ? escape '${escapeChar}'`, [
      dbKey,
      `${transformedValue}%`,
    ])
}

const inPrefix = (ctx, queryKey, dbKey = queryKey, transform = (v) => v) => {
  if (typeof ctx.query[queryKey] === 'undefined') {
    return null
  }

  const escapeChar = '\\'

  const transformedValues = transform(toArray(ctx.query[queryKey]))

  if (!Array.isArray(transformedValues)) {
    // ctx.throw(422, 'Invalid filter param', { errors: { [queryKey]: ['Param must be an array'] }})
    throw new Error(
      'Invalid transformation, filter value after transform must be array',
    )
  }

  if (!transformedValues.length) return

  const transformedValuesEscaped = transformedValues.map((v) =>
    escapeSqlLikePatternMatching(v, escapeChar),
  )

  // per https://stackoverflow.com/a/38074246/710693
  return (knexBuilder) =>
    knexBuilder.whereRaw(
      `?? like any(array[${transformedValuesEscaped
        .map((_v) => '?')
        .join(',')}])`,
      [dbKey, ...transformedValuesEscaped.map((v) => `${v}%`)],
    )
}

const between = (
  ctx,
  queryKeyPrefix,
  dbKey = queryKeyPrefix,
  transform = (v) => v,
) => {
  const valueFrom = ctx.query[`${queryKeyPrefix}From`]
  const valueTo = ctx.query[`${queryKeyPrefix}To`]

  if (typeof valueFrom === 'undefined' && typeof valueTo === 'undefined') {
    return null
  }

  const valueFromTransformed = transform(valueFrom)
  const valueToTransformed = transform(valueTo)

  return (knexBuilder) =>
    valueFromTransformed && valueToTransformed
      ? knexBuilder.whereBetween(dbKey, [
          valueFromTransformed,
          valueToTransformed,
        ])
      : valueFromTransformed
      ? knexBuilder.where(dbKey, '>=', valueFromTransformed)
      : knexBuilder.where(dbKey, '<=', valueToTransformed)
}

const regExp = (
  ctx,
  queryKey,
  dbKey = queryKey,
  transform = (escapedValue) => escapedValue,
  isCaseSensitive = false,
) => {
  if (typeof ctx.query[queryKey] === 'undefined') {
    return null
  }

  const transformedValue = transform(escapeRegexp(ctx.query[queryKey]))

  const operator = isCaseSensitive ? '~' : '~*'

  return (knexBuilder) =>
    knexBuilder.whereRaw(`?? ${operator} ?`, [dbKey, `${transformedValue}`])
}

const inRegExp = (
  ctx,
  queryKey,
  dbKey = queryKey,
  transform = (escapedValues) => escapedValues,
  isCaseSensitive = false,
) => {
  if (typeof ctx.query[queryKey] === 'undefined') {
    return null
  }

  const transformedValues = transform(
    toArray(ctx.query[queryKey]).map((v) => escapeRegexp(v)),
  )

  if (!Array.isArray(transformedValues)) {
    // ctx.throw(422, 'Invalid filter param', { errors: { [queryKey]: ['Param must be an array'] }})
    throw new Error(
      'Invalid transformation, filter value after transform must be array',
    )
  }

  if (!transformedValues.length) return

  const operator = isCaseSensitive ? '~' : '~*'

  // per https://stackoverflow.com/a/38074246/710693
  return (knexBuilder) =>
    knexBuilder.whereRaw(
      `?? ${operator} any(array[${transformedValues
        .map((_v) => '?')
        .join(',')}])`,
      [dbKey, ...transformedValues],
    )
}

let filters = {
  builder,
  negate,
  eq,
  gt,
  gte,
  lt,
  lte,
  bool,
  in: $in,
  prefix,
  inPrefix,
  between,
  regExp,
  inRegExp,
  // published,
}

for (const filterKey of Object.keys(filters)) {
  filters[filterKey] = validableFilter(validate, filters[filterKey], {
    isArrayFilter: ['inPrefix', 'in'].includes(filterKey),
  })
}

const multipleColumnsFilter = (ctx, queryKey, filtersDefinitions) => {
  if (typeof ctx.query[queryKey] === 'undefined') {
    return null
  }

  if (!Array.isArray(filtersDefinitions)) {
    throw new Error(
      'Argument filtersDefinition passed to multipleColumnsFilter must be an array',
    )
  }

  if (
    !filtersDefinitions.every((def) => {
      return (
        typeof def.column === 'string' &&
        typeof def.filter === 'function' &&
        (!def.extraArgs || Array.isArray(def.extraArgs))
      )
    })
  ) {
    throw new Error(
      'Argument filters definition passed to multipleColumnsFilter has invalid properties',
    )
  }

  const ourOwnFilters = Object.values(filters)

  return (knexBuilder) =>
    knexBuilder.where((b) => {
      for (const filterDefinition of filtersDefinitions) {
        const { column, filter, extraArgs = [] } = filterDefinition
        const isCustomFilter = !ourOwnFilters.includes(filter)
        b.orWhere((b) =>
          isCustomFilter
            ? filter(b)
            : filter(ctx, queryKey, column, ...extraArgs)(b),
        )
      }
    })
}

filters = {
  ...filters,
  multipleColumnsFilter,
}

module.exports = { filters }
