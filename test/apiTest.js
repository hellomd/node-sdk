const expect = require('./expect')

const { buildApi } = require('../src/api')
const { mockApi } = require('../src/apiMock')
const { axiosMock } = require('../src/axios')

const ctx = { state: { id: 'userId', serviceToken: 'serviceToken' } }

describe('api', () => {
  beforeEach(() => {
    axiosMock.reset()
  })

  describe('', () => {
    it('url as string', async function() {
      const definition = { get: { url: '/users' } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.get().reply(200)

      return expect(api.get()).to.eventually.be.fulfilled
    })

    it('url as function', async function() {
      const url = (ctx, { id }) => `/users/${ctx.state.id}/orders/${id}`
      const definition = { get: { url } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.get({ id: 'orderId' }).reply(200)

      return expect(api.get({ id: 'orderId' })).to.eventually.be.fulfilled
    })

    it('get method', async function() {
      const definition = { get: { url: '/users', method: 'get' } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.get().reply(200)

      return expect(api.get()).to.eventually.be.fulfilled
    })

    it('post method', async function() {
      const definition = { post: { url: '/users', method: 'post' } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.post().reply(200)

      return expect(api.post()).to.eventually.be.fulfilled
    })

    it('put method', async function() {
      const definition = { put: { url: '/users', method: 'put' } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.put().reply(200)

      return expect(api.put()).to.eventually.be.fulfilled
    })

    it('patch method', async function() {
      const definition = { patch: { url: '/users', method: 'patch' } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.patch().reply(200)

      return expect(api.patch()).to.eventually.be.fulfilled
    })

    it('delete method', async function() {
      const definition = { delete: { url: '/users', method: 'delete' } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.delete().reply(200)

      return expect(api.delete()).to.eventually.be.fulfilled
    })

    it('default transform', async function() {
      const definition = { get: { url: '/users' } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.get().reply(200, [{ name: 'John' }])

      return expect(api.get()).to.eventually.be.deep.equal([{ name: 'John' }])
    })

    it('custom transform', async function() {
      const definition = {
        get: { url: '/users', transform: x => x.map(({ secret, ...y }) => y) },
      }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.get().reply(200, [{ name: 'John', secret: '123' }])

      return expect(api.get()).to.eventually.be.deep.equal([{ name: 'John' }])
    })

    it('custom transform', async function() {
      const definition = {
        get: { url: '/users', transform: x => x.map(({ secret, ...y }) => y) },
      }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.get().reply(200, [{ name: 'John', secret: '123' }])

      return expect(api.get()).to.eventually.be.deep.equal([{ name: 'John' }])
    })

    it('default error', async function() {
      const definition = {
        get: { url: '/users' },
      }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.get().reply(500)

      return expect(api.get()).to.eventually.be.rejectedWith(
        'Request failed with status code 500',
      )
    })

    it('custom errors', async function() {
      const errors = { 500: { message: 'Could not get users' } }
      const definition = { get: { url: '/users', errors } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.get().reply(500)

      return expect(api.get()).to.eventually.be.rejectedWith(
        'Could not get users',
      )
    })

    it('returns default error when configured to do so', async function() {
      const definition = {
        get: { url: '/users' },
      }
      const api = buildApi(definition, {
        shouldReturnOriginalRequestError: true,
      })(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.get().reply(500)

      return expect(api.get())
        .to.eventually.be.rejectedWith('Request failed with status code 500')
        .and.have.property('response')
    })

    it('data as object', async function() {
      const definition = { post: { url: '/users', data: { name: 'John' } } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.post().reply(200)

      return expect(api.post()).to.eventually.be.fulfilled
    })

    it('data as function', async function() {
      const data = (ctx, args) => ({ id: ctx.state.id, name: args.name })
      const definition = { post: { url: '/users', data } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.post({ name: 'John' }).reply(200)

      return expect(api.post({ name: 'John' })).to.eventually.be.fulfilled
    })

    it('default headers', async function() {
      const definition = { get: { url: '/users' } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock
        .get()
        .reply(({ headers }) =>
          headers.Authorization === `bearer ${ctx.state.serviceToken}`
            ? [200]
            : [404],
        )

      return expect(api.get()).to.eventually.be.fulfilled
    })

    it('custom header', async function() {
      const customHeader = ctx => ({
        'Content-Type': 'image/png',
      })
      const definition = { get: { url: '/users', headers: [customHeader] } }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock
        .get()
        .reply(({ headers }) =>
          headers['Content-Type'] === 'image/png' ? [200] : [404],
        )

      return expect(api.get()).to.eventually.be.fulfilled
    })

    it('multiple headers', async function() {
      const customHeaderA = ctx => ({ 'X-Custom-A': 'Custom A' })
      const customHeaderB = ctx => ({ 'X-Custom-B': 'Custom B' })

      const definition = {
        get: { url: '/users', headers: [customHeaderA, customHeaderB] },
      }
      const api = buildApi(definition)(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock
        .get()
        .reply(({ headers }) =>
          headers['X-Custom-A'] === 'Custom A' &&
          headers['X-Custom-B'] === 'Custom B'
            ? [200]
            : [404],
        )

      return expect(api.get()).to.eventually.be.fulfilled
    })

    it('uses endpoint definition option instead of global passed one', async function() {
      const definition = {
        get: { url: '/users', shouldReturnOriginalRequestError: false },
      }
      const api = buildApi(definition, {
        shouldReturnOriginalRequestError: true,
      })(ctx)
      const apiMock = mockApi(ctx)(definition)

      apiMock.get().reply(500)

      return expect(api.get())
        .to.eventually.be.rejectedWith('Request failed with status code 500')
        .and.to.not.have.property('response')
    })
  })
})
