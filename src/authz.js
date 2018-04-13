const { axios, axiosMock } = require('./axios')

const baseUrl = process.env.AUTHORIZATION_URL || 'http://authorization'
const maxRetries = 3

const errors = {
  forbidden: 'Forbidden',
  permitUnavailable: 'Could not check permission',
  attachRoleUnavailable: 'Could not attach role',
  detachRoleUnavailable: 'Could not detach role',
}

const api = {
  /**
   * @apiDefine AuthError
   * @apiError 403 Forbidden
   */
  permit: async (userId, method, resource) => {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        await axios.head(
          `${baseUrl}/users/${userId}/permissions/${method}/${resource}`,
        )
        return true
      } catch (err) {
        if (err.response && err.response.status == 403) {
          throw errors.forbidden
        }
        if (i == 3) {
          throw errors.permitUnavailable
        }
      }
    }
  },

  attachRole: async (user, role) => {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        await axios.put(`${baseUrl}/users/${user}/roles/${role}`)
        break
      } catch (err) {
        if (i == 3) {
          throw errors.attachRoleUnavailable
        }
      }
    }
  },

  detachRole: async (user, role) => {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        await axios.delete(`${baseUrl}/users/${user}/roles/${role}`)
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
  onPermit: (userId, method, resource) =>
    axiosMock.onHead(
      `${baseUrl}/users/${userId}/permissions/${method}/${resource}`,
    ),

  onAttachRole: (userId, role) =>
    axiosMock.onPut(new RegExp(`${baseUrl}\/users\/${userId}\/roles/${role}`)),

  onDetachRole: (userId, role) =>
    axiosMock.onDelete(`${baseUrl}/users/${userId}/roles/${role}`),
}

const koa = {
  permit: async (ctx, method, resource) => {
    try {
      const { id, isService = false } = ctx.state.user
      if (isService) {
        return
      }
      await api.permit(id, method, resource)
    } catch (err) {
      if (err === errors.forbidden) {
        ctx.throw(403, errors.forbidden)
      }
      ctx.throw(500, errors.permitUnavailable)
    }
  },

  attachRole: async (ctx, user, role) => {
    try {
      await api.attachRole(user, role)
    } catch (err) {
      ctx.throw(500, err)
    }
  },

  detachRole: async (ctx, user, role) => {
    try {
      await api.detachRole(user, role)
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
