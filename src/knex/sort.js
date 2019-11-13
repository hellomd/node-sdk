const { sort: _sort } = require('../mongo/sort')

/**
 * @apiDefine Sort
 * @apiParam {String} [sort] Sorting criteria. e.g. `name`, `-name`
 */
const sort = (ctx, defaultSort) => {
  const sorting = _sort(ctx, defaultSort)

  return Object.entries(sorting).reduce((acc, [field, direction]) => {
    return [
      ...acc,
      {
        column: field,
        order: direction >= 1 ? 'asc' : 'desc',
      },
    ]
  }, [])
}

module.exports = { sort }
