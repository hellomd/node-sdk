const { axiosMock } = require('./axios')
const { serviceTokenHeader } = require('./api')

const methodMap = {
  get: 'onGet',
  post: 'onPost',
  put: 'onPut',
  patch: 'onPatch',
  delete: 'onDelete',
  head: 'onHead',
}

const mockEndpoint = ctx => def => {
  const {
    method = 'get',
    url: urlFn,
    data: dataFn,
    headers: headerFns = [serviceTokenHeader],
  } = def

  return args => {
    const url = typeof urlFn === 'function' ? urlFn(ctx, args) : urlFn
    const data = typeof dataFn === 'function' ? dataFn(ctx, args) : dataFn
    const headers =
      typeof headerFns === 'function' ? headerFns(ctx, args) : headerFns
    const finalHeaders = Object.assign(
      { Accept: 'application/json, text/plain, */*' },
      headers.reduce((prev, curr) => Object.assign(prev, curr(ctx)), {}),
    )
    return axiosMock[methodMap[method]](url, data, finalHeaders)
  }
}

const mockApi = ctx => def =>
  Object.entries(def).reduce(
    (prev, [k, v]) => ({ ...prev, [k]: mockEndpoint(ctx)(v) }),
    {},
  )

module.exports = {
  mockApi,
  mockEndpoint,
}
