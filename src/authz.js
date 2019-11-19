const { axios, axiosMock } = require('./axios')
const { TOKEN_KIND } = require('./authn')

const { isTesting } = require('./isTesting')
const { logger: defaultLogger } = require('./logging')

const baseUrl = process.env.AUTHORIZATION_URL || 'http://authorization'
const maxRetries = 3

const errors = {
  unauthenticated: 'Unauthenticated',
  forbidden: 'Forbidden',
  permitUnavailable: 'Could not check permission',
  attachRoleUnavailable: 'Could not attach role',
  detachRoleUnavailable: 'Could not detach role',
}

const buildServiceTokenHeaders = token => ({
  headers: {
    'Content-Type': 'application/json',
    Authorization: `bearer ${token}`,
  },
})

const api = {
  /**
   * @apiDefine AuthError
   * @apiError 403 Forbidden
   */
  permit: async (
    refId,
    method,
    resource,
    refKind = 'user',
    ctx = {},
    options = { shouldUseRef: !!process.env.HMD_AUTHZ_USE_REF },
  ) => {
    const { logger = defaultLogger } = ctx

    for (let i = 0; i <= maxRetries; i++) {
      const url = `${baseUrl}/${
        options.shouldUseRef ? `${refKind}:${refId}` : `users/${refId}`
      }/permissions/${method}/${resource}`

      try {
        await axios.head(url, {
          headers: {
            // add request-id header by default
            ...(!!ctx &&
              !!ctx.state &&
              !!ctx.state.id &&
              !isTesting && { 'X-Request-Id': ctx.state.id }),
          },
        })
        return true
      } catch (err) {
        const { _request, ...logObject } = err && err.response
        if (err.response && err.response.status == 403) {
          throw errors.forbidden
        }
        if (i == 3) {
          logger.debug('authz client axios request failed', {
            error: err,
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
          logger.error('Error while retrieving permissions', {
            error: err,
            url,
          })
          throw errors.permitUnavailable
        }
      }
    }
  },

  attachRole: async (
    refId,
    role,
    token,
    refKind = 'user',
    ctx = {},
    options = { shouldUseRef: !!process.env.HMD_AUTHZ_USE_REF },
  ) => {
    const headers = buildServiceTokenHeaders(token)
    for (let i = 0; i <= maxRetries; i++) {
      try {
        await axios({
          method: 'put',
          url: `${baseUrl}/${
            options.shouldUseRef ? `${refKind}:${refId}` : `users/${refId}`
          }/roles/${role}`,
          headers: {
            // add request-id header by default
            ...(!!ctx &&
              !!ctx.state &&
              !!ctx.state.id &&
              !isTesting && { 'X-Request-Id': ctx.state.id }),
            ...headers,
          },
        })
        break
      } catch (err) {
        if (i == 3) {
          throw errors.attachRoleUnavailable
        }
      }
    }
  },

  detachRole: async (
    refId,
    role,
    token,
    refKind = 'user',
    ctx = {},
    options = { shouldUseRef: !!process.env.HMD_AUTHZ_USE_REF },
  ) => {
    const headers = buildServiceTokenHeaders(token)
    for (let i = 0; i <= maxRetries; i++) {
      try {
        await axios({
          method: 'delete',
          url: `${baseUrl}/${
            options.shouldUseRef ? `${refKind}:${refId}` : `users/${refId}`
          }/roles/${role}`,
          headers: {
            // add request-id header by default
            ...(!!ctx &&
              !!ctx.state &&
              !!ctx.state.id &&
              !isTesting && { 'X-Request-Id': ctx.state.id }),
            ...headers,
          },
        })
        break
      } catch (err) {
        if (i == 3) {
          throw errors.detachRoleUnavailable
        }
      }
    }
  },
}

const mocks = {
  onPermit: (
    refId,
    method,
    resource,
    refKind = 'user',
    options = { shouldUseRef: !!process.env.HMD_AUTHZ_USE_REF },
  ) =>
    axiosMock.onHead(
      `${baseUrl}/${
        options.shouldUseRef ? `${refKind}:${refId}` : `users/${refId}`
      }/permissions/${method}/${resource}`,
    ),

  onAttachRole: (
    refId,
    role,
    refKind = 'user',
    options = { shouldUseRef: !!process.env.HMD_AUTHZ_USE_REF },
  ) =>
    axiosMock.onPut(
      new RegExp(
        `${baseUrl}/${
          options.shouldUseRef ? `${refKind}:${refId}` : `users/${refId}`
        }/roles/${role}`,
      ),
    ),

  onDetachRole: (
    refId,
    role,
    refKind = 'user',
    options = { shouldUseRef: !!process.env.HMD_AUTHZ_USE_REF },
  ) =>
    axiosMock.onDelete(
      `${baseUrl}/${
        options.shouldUseRef ? `${refKind}:${refId}` : `users/${refId}`
      }/roles/${role}`,
    ),
}

const koa = {
  permit: async (ctx, method, resource) => {
    if (!ctx.state.user) {
      // @TODO Throw 403 directly instead of 401? authz requires auth
      ctx.throw(401, errors.unauthenticated)
    }

    const { id, isService = false, kind } = ctx.state.user

    if (isService || kind === TOKEN_KIND.SERVICE) {
      return
    }

    const refKind = kind

    try {
      await api.permit(id, method, resource, refKind, ctx)
    } catch (err) {
      if (err === errors.forbidden) {
        ctx.throw(403, errors.forbidden)
      }

      ctx.throw(500, errors.permitUnavailable)
    }
  },

  attachRole: async (ctx, refId, role, refKind = 'user') => {
    try {
      const token = ctx.state.serviceToken
      await api.attachRole(refId, role, token, refKind, ctx)
    } catch (err) {
      ctx.throw(500, err)
    }
  },

  detachRole: async (ctx, refId, role, refKind = 'user') => {
    try {
      const token = ctx.state.serviceToken
      await api.detachRole(refId, role, token, refKind, ctx)
    } catch (err) {
      ctx.throw(500, err)
    }
  },
}

module.exports = {
  api,
  errors,
  ...mocks,
  ...koa,
}
