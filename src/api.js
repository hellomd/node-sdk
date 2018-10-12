const util = require('util')
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
    fetchOptions = {},
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
          ...fetchOptions,
        })
        return transform(results)
      } catch (error) {
        if (debug) {
          const { request, ...logObject } = error.response
          console.log(
            util.inspect(logObject, {
              depth: 4,
              colors: true,
            }),
          )
        }
        const resCode = error.response ? error.response.status : 500
        if (resCode < 500 || i === maxRetries) {
          const customError = errors[resCode.toString()]
          const isCustomErrorInstance = customError instanceof Error
          
          if (customError && typeof customError.message === 'function') {
            customError.message = customError.message(ctx, err.response)
          }

          const finalError = isCustomErrorInstance ? customError : new Error(error.message)
          
          if (customError && !isCustomErrorInstance) {
            finalError.message = customError.message
          }

          if (!finalError.code) {
            finalError.code = error.response ? error.response.status : 500
          }

          throw finalError
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
