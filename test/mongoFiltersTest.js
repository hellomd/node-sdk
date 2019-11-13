const { expect } = require('chai')
const sinon = require('sinon')

const filters = require('../src/mongo/filters')

describe('mongodb filters', () => {
  describe('eq', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.eq(ctx, 'foo')
      expect(query).to.eql({ foo: 'bar' })
    })

    it('returns fulfilled null query', function() {
      const ctx = { query: { foo: 'null' } }
      const query = filters.eq(ctx, 'foo')
      expect(query).to.eql({ foo: null })
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.eq(ctx, 'foo', 'bar')
      expect(query).to.eql({ bar: 'bar' })
    })

    it('returns fulfilled null query with db key', function() {
      const ctx = { query: { foo: null } }
      const query = filters.eq(ctx, 'foo', 'bar')
      expect(query).to.eql({ bar: null })
    })

    it('returns fulfilled query with transform', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.eq(ctx, 'foo', 'foo', v => `${v}!!`)
      expect(query).to.eql({ foo: 'bar!!' })
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }
      const query = filters.eq(ctx, 'foo')
      expect(query).to.eql({})
    })

    it('is validable', function() {
      const spy = sinon.spy()

      const ctx = { query: { foo: '123' }, throw: spy }
      const query = filters.eq(ctx, 'foo', 'foo', v => v, {
        constraints: { objectId: true },
      })

      expect(spy).to.have.been.calledWith(422, 'Unprocessable Entity', {
        errors: { foo: ['Foo is not a valid id'] },
      })
    })
  })

  describe('in', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: ['bar', 'baz'] } }
      const query = filters.in(ctx, 'foo')
      expect(query).to.eql({ foo: { $in: ['bar', 'baz'] } })
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: ['bar', 'baz'] } }
      const query = filters.in(ctx, 'foo', 'bar')
      expect(query).to.eql({ bar: { $in: ['bar', 'baz'] } })
    })

    it('returns fulfilled query with transform', function() {
      const ctx = { query: { foo: ['bar', 'baz'] } }
      const query = filters.in(ctx, 'foo', 'foo', v => v.map(x => `${x}!!`))
      expect(query).to.eql({ foo: { $in: ['bar!!', 'baz!!'] } })
    })

    it('transforms into array', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.in(ctx, 'foo')
      expect(query).to.eql({ foo: { $in: ['bar'] } })
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }
      const query = filters.in(ctx, 'foo')
      expect(query).to.eql({})
    })
  })

  describe('inRegExp', () => {
    it('returns fulfilled query', function() {
      const params = ['bar', 'baz']
      const ctx = { query: { foo: params } }
      const query = filters.inRegExp(ctx, 'foo')

      expect(query.foo.$in)
        .to.be.an('array')
        .of.length(2)

      for (const [index, val] of query.foo.$in.entries()) {
        expect(val).to.eql(new RegExp(`${params[index]}`, 'i'))
      }
    })

    it('returns fulfilled query with modifier and dbkey', function() {
      const params = ['bar', 'baz']
      const ctx = { query: { foo: params } }
      const query = filters.inRegExp(ctx, 'foo', 'fooDb', 'ig')

      expect(query.fooDb.$in)
        .to.be.an('array')
        .of.length(2)

      for (const [index, val] of query.fooDb.$in.entries()) {
        expect(val).to.eql(new RegExp(`${params[index]}`, 'ig'))
      }
    })

    it('transforms into array', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.inRegExp(ctx, 'foo')

      expect(query.foo.$in)
        .to.be.an('array')
        .of.length(1)

      expect(query.foo.$in[0]).to.eql(/bar/i)
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }
      const query = filters.inRegExp(ctx, 'foo')
      expect(query).to.eql({})
    })
  })

  describe('inPrefix', () => {
    it('returns fulfilled query', function() {
      const params = ['bar', 'baz']
      const ctx = { query: { foo: params } }
      const query = filters.inPrefix(ctx, 'foo')

      expect(query.foo.$in)
        .to.be.an('array')
        .of.length(2)

      for (const [index, val] of query.foo.$in.entries()) {
        expect(val).to.eql(new RegExp(`^${params[index]}`, 'i'))
      }
    })

    it('returns fulfilled query with modifier and dbkey', function() {
      const params = ['bar', 'baz']
      const ctx = { query: { foo: params } }
      const query = filters.inPrefix(ctx, 'foo', 'fooDb', 'ig')

      expect(query.fooDb.$in)
        .to.be.an('array')
        .of.length(2)

      for (const [index, val] of query.fooDb.$in.entries()) {
        expect(val).to.eql(new RegExp(`^${params[index]}`, 'ig'))
      }
    })

    it('transforms into array', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.inPrefix(ctx, 'foo')

      expect(query.foo.$in)
        .to.be.an('array')
        .of.length(1)

      expect(query.foo.$in[0]).to.eql(/^bar/i)
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }
      const query = filters.inPrefix(ctx, 'foo')
      expect(query).to.eql({})
    })
  })

  describe('ne', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.ne(ctx, 'foo')
      expect(query).to.eql({ foo: { $ne: 'bar' } })
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.ne(ctx, 'foo', 'bar')
      expect(query).to.eql({ bar: { $ne: 'bar' } })
    })

    it('returns fulfilled query with transform', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.ne(ctx, 'foo', 'foo', v => `${v}!!`)
      expect(query).to.eql({ foo: { $ne: 'bar!!' } })
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }
      const query = filters.ne(ctx, 'foo')
      expect(query).to.eql({})
    })
  })

  describe('nin', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: ['bar', 'baz'] } }
      const query = filters.nin(ctx, 'foo')
      expect(query).to.eql({ foo: { $nin: ['bar', 'baz'] } })
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: ['bar', 'baz'] } }
      const query = filters.nin(ctx, 'foo', 'bar')
      expect(query).to.eql({ bar: { $nin: ['bar', 'baz'] } })
    })

    it('returns fulfilled query with transform', function() {
      const ctx = { query: { foo: ['bar', 'baz'] } }
      const query = filters.nin(ctx, 'foo', 'foo', v => v.map(x => `${x}!!`))
      expect(query).to.eql({ foo: { $nin: ['bar!!', 'baz!!'] } })
    })

    it('transforms into array', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.nin(ctx, 'foo')
      expect(query).to.eql({ foo: { $nin: ['bar'] } })
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }
      const query = filters.nin(ctx, 'foo')
      expect(query).to.eql({})
    })
  })

  describe('bool', () => {
    it('returns fulfilled query with true', function() {
      const ctx = { query: { foo: 'true' } }
      const query = filters.bool(ctx, 'foo')
      expect(query).to.eql({ foo: true })
    })

    it('returns fulfilled query with false', function() {
      const ctx = { query: { foo: 'false' } }
      const query = filters.bool(ctx, 'foo')
      expect(query).to.eql({ foo: false })
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: 'true' } }
      const query = filters.bool(ctx, 'foo', 'bar')
      expect(query).to.eql({ bar: true })
    })

    it('returns fulfilled query with transform', function() {
      const ctx = { query: { foo: 'true' } }
      const query = filters.bool(ctx, 'foo', 'foo', v => !v)
      expect(query).to.eql({ foo: false })
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }
      const query = filters.bool(ctx, 'foo')
      expect(query).to.eql({})
    })
  })

  describe('prefix', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.prefix(ctx, 'foo')
      expect(query).to.eql({ foo: /^bar/i })
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.prefix(ctx, 'foo', 'bar')
      expect(query).to.eql({ bar: /^bar/i })
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }
      const query = filters.prefix(ctx, 'foo')
      expect(query).to.eql({})
    })
  })

  describe('regExp', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.regExp(ctx, 'foo')
      expect(query).to.eql({ foo: /bar/i })
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.regExp(ctx, 'foo', 'bar')
      expect(query).to.eql({ bar: /bar/i })
    })

    it('returns fulfilled query with modifiers', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.regExp(ctx, 'foo', 'foo', 'g')
      expect(query).to.eql({ foo: /bar/g })
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }
      const query = filters.regExp(ctx, 'foo')
      expect(query).to.eql({})
    })
  })

  describe('dateRange', () => {
    it('returns fulfilled query', function() {
      const dateFrom = '2019-08-09T00:00:00.000Z'
      const dateTo = '2019-08-09T23:59:59.999Z'
      const ctx = { query: { fooFrom: dateFrom, fooTo: dateTo } }
      const query = filters.dateRange(ctx, 'foo')
      expect(query).to.eql({
        foo: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
      })
    })

    it('returns empty object when there is no from or to', function() {
      const ctx = { query: {} }
      const query = filters.dateRange(ctx, 'foo')
      expect(query).to.eql({})
    })

    it('works with just from', function() {
      const dateFrom = '2019-08-09T00:00:00.000Z'
      const ctx = { query: { fooFrom: dateFrom } }
      const query = filters.dateRange(ctx, 'foo')
      expect(query).to.eql({
        foo: { $gte: new Date(dateFrom) },
      })
    })

    it('works with just to', function() {
      const dateTo = '2019-08-09T23:59:59.999Z'
      const ctx = { query: { fooTo: dateTo } }
      const query = filters.dateRange(ctx, 'foo')
      expect(query).to.eql({
        foo: { $lte: new Date(dateTo) },
      })
    })

    it('returns fulfilled query with db key', function() {
      const dateFrom = '2019-08-09T00:00:00.000Z'
      const dateTo = '2019-08-09T23:59:59.999Z'
      const ctx = { query: { fooFrom: dateFrom, fooTo: dateTo } }
      const query = filters.dateRange(ctx, 'foo', 'bar')
      expect(query).to.eql({
        bar: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
      })
    })
  })

  describe('published', () => {
    beforeEach(() => {
      this.clock = sinon.useFakeTimers()
    })

    afterEach(() => {
      this.clock.restore()
    })

    it('returns true query', function() {
      const ctx = { query: { published: 'true' } }
      const query = filters.published(ctx)
      expect(query).to.eql({ publishedAt: { $ne: null, $lte: new Date() } })
    })

    it('returns false query', function() {
      const ctx = { query: { published: 'false' } }
      const query = filters.published(ctx)
      expect(query).to.eql({
        $or: [
          { publishedAt: null },
          {
            publishedAt: {
              $gt: new Date(),
            },
          },
        ],
      })
    })

    it('returns empty object when ctx.query has no published key', function() {
      const ctx = { query: {} }
      const query = filters.published(ctx)
      expect(query).to.eql({})
    })
  })
})
