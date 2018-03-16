const { expect } = require('chai')
const filters = require('../src/filters')

describe('filters', () => {
  describe('eq', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.eq(ctx, 'foo')
      expect(query).to.eql({ foo: 'bar' })
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = filters.eq(ctx, 'foo', 'bar')
      expect(query).to.eql({ bar: 'bar' })
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

  describe('published', () => {
    it('returns true query', function() {
      const ctx = { query: { published: 'true' } }
      const query = filters.published(ctx)
      expect(query).to.eql({ publishedAt: { $ne: null } })
    })

    it('returns false query', function() {
      const ctx = { query: { published: 'false' } }
      const query = filters.published(ctx)
      expect(query).to.eql({ publishedAt: null })
    })

    it('returns empty object when ctx.query has no published key', function() {
      const ctx = { query: {} }
      const query = filters.published(ctx)
      expect(query).to.eql({})
    })
  })
})
