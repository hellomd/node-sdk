const { expect } = require('chai')
const Koa = require('koa')
const request = require('supertest')
const paginate = require('../src/paginate')

const servers = []

const createAppWithCount = (count) => {
  const app = new Koa()
  app.use(async ctx => {
    ctx.body = await paginate(ctx, count)
  })
  const server = app.listen()
  servers.push(server)
  return server
}

describe('paginate', () => {
  after(() => servers.map(server => server.close()))

  it('works with page=1 perPage=20 foo=bar', async function() {
    const app = createAppWithCount(500)
    const { body, headers } = await request(app)
      .get('/?page=1&perPage=20&foo=bar')
    expect(headers['x-total-count']).to.be.equal('500')
    expect(headers['link']).to.include('?page=0&perPage=20&foo=bar>; rel="first"')
    expect(headers['link']).to.include('?page=25&perPage=20&foo=bar>; rel="last"')
    expect(headers['link']).to.include('?page=0&perPage=20&foo=bar>; rel="prev"')
    expect(headers['link']).to.include('?page=2&perPage=20&foo=bar>; rel="next"')
    expect(body.limit).to.be.equal(20)
    expect(body.skip).to.be.equal(20)
  })

  it('works with foo=bar', async function() {
    const app = createAppWithCount(345)
    const { body, headers } = await request(app)
      .get('/?foo=bar')
    expect(headers['x-total-count']).to.be.equal('345')
    expect(headers['link']).to.include('?foo=bar&page=0>; rel="first"')
    expect(headers['link']).to.include('?foo=bar&page=18>; rel="last"')
    expect(body.limit).to.be.equal(20)
    expect(body.skip).to.be.equal(0)
  })
})