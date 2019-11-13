const R = require('ramda')
const qs = require('querystring')

const getUrlWithoutQuerystring = ctx => ctx.href.replace(ctx.search, '')

const extractPaginationOptions = (
  ctx,
  defaultPerPage = 20,
  maxPerPage = 500,
) => {
  const { page: rawPage = 0, perPage: rawPerPage = defaultPerPage } = ctx.query
  const [page, perPage] = [rawPage, rawPerPage].map(n => parseInt(n))
  const limit = R.clamp(1, perPage, maxPerPage)
  const skip = page * limit
  return { page, perPage, limit, skip }
}

const createUrl = (ctx, page) => {
  const url = getUrlWithoutQuerystring(ctx)
  const querystring = qs.stringify({ ...ctx.query, page })
  return `${url}?${querystring}`
}

const appendLink = (ctx, rel, url) => {
  ctx.append('Link', `<${url}>; rel="${rel}"`)
}

const setLink = (ctx, total, paginationOptions) => {
  const { page, perPage } = paginationOptions || extractPaginationOptions(ctx)
  const lastPage = Math.ceil(total / perPage)

  appendLink(ctx, 'first', createUrl(ctx, 0))
  appendLink(ctx, 'last', createUrl(ctx, lastPage))

  page > 0 && appendLink(ctx, 'prev', createUrl(ctx, page - 1))
  page < lastPage && appendLink(ctx, 'next', createUrl(ctx, page + 1))
}

const setTotaCount = (ctx, total) => {
  ctx.set('X-Total-Count', total)
}

const setPaginationResponseFields = (ctx, total, paginationOptions) => {
  // extract total from second param in case it's a object
  //  If it's an object, that means the second param is the paginationOptions param with a total property
  total = typeof total === 'object' ? total.total : total
  paginationOptions =
    typeof total === 'object' && typeof paginationOptions === 'undefined'
      ? total
      : paginationOptions

  setLink(ctx, total, paginationOptions)
  setTotaCount(ctx, total)
}

/**
 * @apiDefine Pagination
 * @apiParam {Number} [page=0] Page number
 * @apiParam {Number} [perPage=20] Amount of items per page
 */
const paginate = (ctx, total, defaultPerPage, maxPerPage) => {
  const paginationOptions = extractPaginationOptions(
    ctx,
    defaultPerPage,
    maxPerPage,
  )
  if (typeof total !== 'undefined') {
    setPaginationResponseFields(ctx, total, paginationOptions)
  }
  return paginationOptions
}

module.exports = {
  paginate,
  extractPaginationOptions,
  setPaginationResponseFields,
}
