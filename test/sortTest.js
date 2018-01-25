const { expect } = require('chai')
const Koa = require('koa')
const request = require('supertest')
const { createServer } = require('./testHelpers')
const sort = require('../src/sort')

const createAppWithDefaultSort = (defaultSort) => {
  const { app, server } = createServer()
  app.use(ctx => {
    ctx.body = sort(ctx, defaultSort)
  })
  return server
}

describe('sort', () => {
  it('works with sort=foo', async function() {
    const app = createAppWithDefaultSort()
    const { body } = await request(app).get('/?sort=foo')
    expect(body).to.be.eql({ foo: 1 })
  })

  it('works with sort=-foo', async function() {
    const app = createAppWithDefaultSort()
    const { body } = await request(app).get('/?sort=-foo')
    expect(body).to.be.eql({ foo: -1 })
  })

  it('works with sort=+foo', async function() {
    const app = createAppWithDefaultSort()
    const { body } = await request(app).get('/?sort=+foo')
    expect(body).to.be.eql({ foo: 1 })
  })

  it('works with sort=foo&sort=bar', async function() {
    const app = createAppWithDefaultSort()
    const { body } = await request(app).get('/?sort=foo&sort=bar')
    expect(body).to.be.eql({ foo: 1, bar: 1 })
  })
})