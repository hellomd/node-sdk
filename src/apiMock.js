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
    const headers = Object.assign(
      { Accept: 'application/json, text/plain, */*' },
      headerFns.reduce((prev, curr) => Object.assign(prev, curr(ctx)), {
        // add X-Request-Id to match original api
        ...(!!ctx.state.id && { 'X-Request-Id': ctx.state.id }),
      }),
    )
    return axiosMock[methodMap[method]](url, data, headers)
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
