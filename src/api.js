const { axios } = require('./axios')

const serviceTokenHeader = (ctx, args) => ({
  'Content-Type': 'application/json',
  Authorization: `bearer ${ctx.state.serviceToken}`,
})

const buildKoaEndpoint = ctx => def => {
  return async args => {
    try {
      return await buildEndpoint(ctx)(def)(args)
    } catch (err) {
      ctx.throw(err.code, err.message)
    }
  }
}

const defaultError = message => ({
  code: '500',
  message,
})

const newError = ({ message, ...obj }) => Object.assign(new Error(message), obj)

const buildEndpoint = ctx => def => {
  const {
    method = 'GET',
    url: urlFn,
    data: dataFn,
    transform = x => x,
    headers = [serviceTokenHeader],
    maxRetries = 3,
    errors = {},
    debug = false,
  } = def

  return async args => {
    const url = typeof urlFn === 'function' ? urlFn(ctx, args) : urlFn
    const data = typeof dataFn === 'function' ? dataFn(ctx, args) : dataFn
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const { data: results } = await axios({
          method,
          url,
          data,
          headers: headers.reduce(
            (prev, curr) =>
              Object.assign(
                prev,
                typeof curr === 'function' ? curr(ctx, args) : curr,
              ),
            {},
          ),
        })
        return transform(results)
      } catch (err) {
        debug && console.log(err.response)
        const resCode = err.response ? err.response.status : 500
        if (resCode < 500 || i === maxRetries) {
          const errObj = errors[resCode.toString()]
          if (errObj && typeof errObj.message === 'function') {
            errObj.message = errObj.message(ctx, err.response)
          }
          throw newError(errObj || defaultError(err))
        }
      }
    }
  }
}

const buildKoaApi = def => ctx =>
  Object.entries(def).reduce(
    (prev, [k, v]) => ({ ...prev, [k]: buildKoaEndpoint(ctx)(v) }),
    {},
  )

const buildApi = def => ctx =>
  Object.entries(def).reduce(
    (prev, [k, v]) => ({ ...prev, [k]: buildEndpoint(ctx)(v) }),
    {},
  )

module.exports = {
  buildApi,
  buildEndpoint,
  buildKoaApi,
  buildKoaEndpoint,
  serviceTokenHeader,
}
