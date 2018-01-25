const stripOperatorFromSort = sort => sort.trim().replace(/^[-+]/, '')

const parseSort = sort => {
  const field = stripOperatorFromSort(sort)
  return {
    [field]: sort.indexOf('-') === 0 ? -1 : 1,
  }
}

/**
 * @apiDefine Sort
 * @apiParam {String} [sort] Sorting criteria. e.g. `name`, `-name`
 */
const sort = (ctx, defaultSort) => {
  const { sort = defaultSort } = ctx.query
  if (Array.isArray(sort)) {
    return sort.reduce((finalObject, currentSort) => ({
      ...finalObject,
      ...parseSort(currentSort)
    }), {})
  }
  return sort ? parseSort(sort) : {}
}

module.exports = sort
