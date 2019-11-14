let Knex = null
try {
  Knex = require('knex')
} catch (error) {
  // do nothing
}

// Code was copied from https://github.com/felixmosh/knex-paginate/blob/19ab6beb05d281daa0cfc4932f11ef9742c470ec/lib/index.js#L1
// Copyright (c) 2019 Felix Mosheev
module.exports.attachPaginate = function attachPaginate() {
  if (!Knex) {
    throw new Error('module knex was not found, you must add it as dependency')
  }

  Knex.QueryBuilder.extend('paginate', function paginate({
    perPage = 10,
    page = 1,
    isFromStart = false,
    isLengthAware = true,
  }) {
    if (isNaN(perPage)) {
      throw new Error('Paginate error: perPage must be a number.')
    }

    if (isNaN(page)) {
      throw new Error('Paginate error: page must be a number.')
    }

    if (typeof isFromStart !== 'boolean') {
      throw new Error('Paginate error: isFromStart must be a boolean.')
    }

    if (typeof isLengthAware !== 'boolean') {
      throw new Error('Paginate error: isLengthAware must be a boolean.')
    }

    const shouldFetchTotals = isLengthAware || page === 1 || isFromStart
    let pagination = {}

    if (page < 1) {
      page = 1
    }

    const offset = isFromStart ? 0 : (page - 1) * perPage
    const limit = isFromStart ? perPage * page : perPage

    // This will paginate the data itself
    this.offset(offset).limit(limit)

    return this.client.transaction(async trx => {
      const result = await this.transacting(trx)

      if (shouldFetchTotals) {
        const groupStmt = this._statements.find(
          stmt => stmt.grouping === 'group',
        )

        const countQuery = await this.clone()
          .clearSelect()
          .clearOrder()
          .clearHaving()
          .modify(qb => {
            qb._clearGrouping('group')

            if (groupStmt) {
              qb.count(`${groupStmt.value[0]} as total`, { distinct: true })
            } else {
              qb.count('* as total')
            }
          })
          .offset(0)
          .first()
          .transacting(trx)

        // countQuery.total is a BigInt here
        const total = parseInt(countQuery.total, 10)

        pagination = {
          ...pagination,
          total,
          lastPage: Math.ceil(total / perPage),
        }
      }

      // Add pagination data to paginator object
      pagination = {
        ...pagination,
        perPage,
        page,
        from: offset,
        to: offset + result.length,
      }

      return { data: result, pagination }
    })
  })
}
