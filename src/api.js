const util = require('util')
const querystring = require('querystring')

const { valueOrFunction } = require('./utils')
const { logger } = require('./logging')

const { axios } = require('./axios')
const { isTesting } = require('./isTesting')

const serviceTokenHeader = (ctx, args) => ({
  'Content-Type': 'application/json',
  Authorization: `bearer ${ctx.state.serviceToken}`,
})

const buildKoaEndpoint = ctx => def => {
  return async args => {
    try {
      return await buildEndpoint(ctx)(def)(args)
    } catch (error) {
      ctx.throw(error.code, error.message)
    }
  }
}

const buildEndpoint = ctx => def => {
  const {
    method = 'GET',
    transform = x => x,
    headers = [serviceTokenHeader],
    maxRetries = 3,
    errors = {},
    debug = false,
    fetchOptions = {},
    shouldReturnOriginalRequestError = false,
  } = def

  return async args => {
    const [url, data, query] = ['url', 'data', 'query'].map(param =>
      valueOrFunction(def[param], ctx, args),
    )
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const response = await axios({
          method,
          url,
          data,
          params: query,
          paramsSerializer: querystring.stringify,
          headers: headers.reduce(
            (prev, curr) =>
              Object.assign(
                prev,
                typeof curr === 'function' ? curr(ctx, args) : curr,
              ),
            {
              // add request-id header by default
              ...(!!ctx.state &&
                !!ctx.state.id &&
                !isTesting && { 'X-Request-Id': ctx.state.id }),
            },
          ),
          ...fetchOptions,
        })
        return transform(response.data, response.headers, response.status)
      } catch (error) {
        const { request, ...logObject } = error.response || error
        if (debug) {
          console.log(
            util.inspect(logObject, {
              depth: 4,
              colors: true,
            }),
          )
        }
        logger.debug('API client axios request failed', {
          error,
          apiStatusCode: logObject && logObject.status,
          apiResultData:
            logObject &&
            logObject.data &&
            JSON.stringify(logObject.data, null, 2),
          apiRequestInfo: {
            method: logObject && logObject.config && logObject.config.method,
            url: logObject && logObject.config && logObject.config.url,
            data:
              logObject &&
              logObject.config &&
              logObject.config.data &&
              JSON.stringify(logObject.config.data, null, 2),
            query:
              logObject &&
              logObject.config &&
              logObject.config.query &&
              JSON.stringify(logObject.config.query, null, 2),
          },
        })

        if (shouldReturnOriginalRequestError) {
          throw error
        }

        const resCode = error.response ? error.response.status : 500
        if (resCode < 500 || i === maxRetries) {
          const customError = errors[resCode.toString()]
          const isCustomErrorInstance = customError instanceof Error

          if (customError && typeof customError.message === 'function') {
            customError.message = customError.message(ctx, error.response)
          }

          const finalError = isCustomErrorInstance
            ? customError
            : new Error(error.message)

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

const buildKoaApi = (def, globalOptions = {}) => ctx =>
  Object.entries(def).reduce(
    (prev, [k, v]) => ({
      ...prev,
      [k]: buildKoaEndpoint(ctx)({ ...globalOptions, ...v }),
    }),
    {},
  )

const buildApi = (def, globalOptions = {}) => ctx =>
  Object.entries(def).reduce(
    (prev, [k, v]) => ({
      ...prev,
      [k]: buildEndpoint(ctx)({ ...globalOptions, ...v }),
    }),
    {},
  )

module.exports = {
  buildApi,
  buildEndpoint,
  buildKoaApi,
  buildKoaEndpoint,
  serviceTokenHeader,
}
