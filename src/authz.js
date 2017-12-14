const { axios, axiosMock } = require('./axios')

const baseUrl = process.env.AUTHORIZATION_URL || 'http://authorization'
const maxRetries = 3

module.exports = {
  onPermit: (userId, method, resource) =>
    axiosMock.onHead(`${baseUrl}/users/${userId}/permissions/${method}/${resource}`),

  permit: async (ctx, method, resource) => {
    for(let i = 0; i <= maxRetries; i++) {
      try {
        await axios.head(`${baseUrl}/users/${ctx.state.user.id}/permissions/${method}/${resource}`)
        return true
      } catch(err) {
        if (err.response && err.response.status == 403) {
          ctx.body = 'Forbidden'
          ctx.status = 403
          return false
        }
        if (i == 3) {
          ctx.throw(500, "Could not check permission")
        }
      }
    }
  },

  attachRole: async (ctx, user, role) => {
    for(let i = 0; i <= maxRetries; i++) {
      try {
        await axios.put(`${baseUrl}/users/${user}/roles`, { role })
        break
      } catch(err) {
        if (i == 3) {
          ctx.throw(500, "Could not attach role")
        }
      }
    }
  },

  detachRole: async (ctx, user, role) => {
    for(let i = 0; i <= maxRetries; i++) {
      try {
        await axios.delete(`${baseUrl}/users/${user}/roles/${role}`)
        break
      } catch(err) {
        if (i == 3) {
          ctx.throw(500, "Could not detach role")
        }
      }
    }
  },

  createRole: async (ctx, role) => {
    for(let i = 1; i <= maxRetries; i++) {
      try {
        await axios.post(baseUrl+'/roles', role)
        break
      } catch(err) {
        if (i == 3) {
          ctx.throw(500, "Could not create role")
        }
      }
    }
  }
}