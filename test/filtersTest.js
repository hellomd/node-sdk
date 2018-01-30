const { expect } = require('chai')
const { eq, regExp, published } = require('../src/filters')

describe('filters', () => {
  describe('eq', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = eq(ctx, 'foo')
      expect(query).to.eql({ foo: 'bar' })
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = eq(ctx, 'foo', 'bar')
      expect(query).to.eql({ bar: 'bar' })
    })

    it('returns fulfilled query with transform', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = eq(ctx, 'foo', 'foo', v => `${v}!!`)
      expect(query).to.eql({ foo: 'bar!!' })
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }
      const query = eq(ctx, 'foo')
      expect(query).to.eql({})
    })
  })

  describe('regExp', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = regExp(ctx, 'foo')
      expect(query).to.eql({ foo: /bar/i })
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = regExp(ctx, 'foo', 'bar')
      expect(query).to.eql({ bar: /bar/i })
    })

    it('returns fulfilled query with modifiers', function() {
      const ctx = { query: { foo: 'bar' } }
      const query = regExp(ctx, 'foo', 'foo', 'g')
      expect(query).to.eql({ foo: /bar/g })
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }
      const query = regExp(ctx, 'foo')
      expect(query).to.eql({})
    })
  })

  describe('published', () => {
    it('returns true query', function() {
      const ctx = { query: { published: 'true' } }
      const query = published(ctx)
      expect(query).to.eql({ publishedAt: { $ne: null } })
    })

    it('returns false query', function() {
      const ctx = { query: { published: 'false' } }
      const query = published(ctx)
      expect(query).to.eql({ publishedAt: null })
    })

    it('returns empty object when ctx.query has no published key', function() {
      const ctx = { query: {} }
      const query = published(ctx)
      expect(query).to.eql({})
    })
  })
})