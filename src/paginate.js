const R = require('ramda')
const qs = require('querystring')

const TOTAL_COUNT_HEADER = 'X-Total-Count'

const getUrlWithoutQuerystring = (ctx) => ctx.href.replace(ctx.search, '')

const extractPaginationOptions = (ctx, defaultPerPage = 20, maxPerPage = 500) => {
  const { page: rawPage = 0, perPage: rawPerPage = 20 } = ctx.query
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

const setLink = (ctx, count) => {
  const { page, perPage, limit } = extractPaginationOptions(ctx)
  const lastPage = Math.ceil(count/perPage)

  appendLink(ctx, 'first', createUrl(ctx, 0))
  appendLink(ctx, 'last', createUrl(ctx, lastPage))
  
  page > 0 && appendLink(ctx, 'prev', createUrl(ctx, page - 1))
  page < lastPage && appendLink(ctx, 'next', createUrl(ctx, page + 1))
}

const setTotaCount = (ctx, count) => {
  ctx.set('X-Total-Count', count)
}

const paginate = (ctx, count, defaultPerPage, maxPerPage) => {
  setLink(ctx, count)
  setTotaCount(ctx, count, defaultPerPage, maxPerPage)
  return extractPaginationOptions(ctx, defaultPerPage, maxPerPage)
}

module.exports = paginate