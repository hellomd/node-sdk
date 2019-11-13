const { expect } = require('chai')
const sinon = require('sinon')
const knex = require('knex')({ client: 'pg' })

const filters = require('../src/knex/filters')

const testTable = 'table_name'

describe('knex pg filters', () => {
  describe('negate', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: 'bar' } }

      const filter = filters.builder([filters.negate([filters.eq(ctx, 'foo')])])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where (not ("foo" = 'bar'))`,
      )
    })
  })

  describe('eq', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: 'bar' } }

      const filter = filters.builder([filters.eq(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name" where ("foo" = 'bar')`)
    })

    it('returns fulfilled null query', function() {
      const ctx = { query: { foo: null } }

      const filter = filters.builder([filters.eq(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name" where ("foo" is null)`)
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: 'bar' } }

      const filter = filters.builder([filters.eq(ctx, 'foo', 'bar')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name" where ("bar" = 'bar')`)
    })

    it('returns fulfilled null query with db key', function() {
      const ctx = { query: { foo: null } }

      const filter = filters.builder([filters.eq(ctx, 'foo', 'bar')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name" where ("bar" is null)`)
    })

    it('returns fulfilled query with transform', function() {
      const ctx = { query: { foo: 'bar' } }

      const filter = filters.builder([
        filters.eq(ctx, 'foo', 'foo', v => `${v}!!`),
      ])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name" where ("foo" = 'bar!!')`)
    })

    it('returns no where when ctx.query has no query key', function() {
      const ctx = { query: {} }

      const filter = filters.builder([filters.eq(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name"`)
    })

    it('is validable', function() {
      const spy = sinon.spy()
      const ctx = { query: { foo: '123' }, throw: spy }

      const filter = filters.builder([
        filters.eq(ctx, 'foo', 'foo', v => v, {
          constraints: { email: true },
        }),
      ])
      const sql = knex(testTable)
        .select('*')
        .where(filter)

      expect(spy).to.have.been.calledWith(422, 'Unprocessable Entity', {
        errors: { foo: ['Foo is not a valid email'] },
      })
    })
  })

  describe('bool', () => {
    it('returns fulfilled query with true', function() {
      const ctx = { query: { foo: 'true' } }

      const filter = filters.builder([filters.bool(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name" where ("foo" = true)`)
    })

    it('returns fulfilled query with false', function() {
      const ctx = { query: { foo: 'false' } }

      const filter = filters.builder([filters.bool(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name" where ("foo" = false)`)
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: 'true' } }

      const filter = filters.builder([filters.bool(ctx, 'foo', 'bar')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name" where ("bar" = true)`)
    })

    it('returns fulfilled query with transform', function() {
      const ctx = { query: { foo: 'true' } }

      const filter = filters.builder([filters.bool(ctx, 'foo', 'foo', v => !v)])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name" where ("foo" = false)`)
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }

      const filter = filters.builder([filters.bool(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name"`)
    })
  })

  describe('in', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: ['bar', 'baz'] } }

      const filter = filters.builder([filters.in(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where (("foo" in ('bar', 'baz')))`,
      )
    })

    it('returns fulfilled query with null value', function() {
      const ctx = { query: { foo: ['bar', 'baz', null] } }

      const filter = filters.builder([filters.in(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where (("foo" in ('bar', 'baz') or "foo" is null))`,
      )
    })

    it('returns fulfilled query with null value and other eq filter', function() {
      const ctx = { query: { foo: ['bar', 'baz', null], foobar: '123' } }

      const filter = filters.builder([
        filters.in(ctx, 'foo'),
        filters.eq(ctx, 'foobar', 'foobar', v => parseInt(v, 10)),
      ])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where (("foo" in ('bar', 'baz') or "foo" is null) and "foobar" = 123)`,
      )
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: ['bar', 'baz'] } }

      const filter = filters.builder([filters.in(ctx, 'foo', 'bar')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where (("bar" in ('bar', 'baz')))`,
      )
    })

    it('returns fulfilled query with transform', function() {
      const ctx = { query: { foo: ['bar', 'baz'] } }

      const filter = filters.builder([
        filters.in(ctx, 'foo', 'foo', v => v.map(v => `${v}!!`)),
      ])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where (("foo" in ('bar!!', 'baz!!')))`,
      )
    })

    it('transforms into array', function() {
      const ctx = { query: { foo: 'bar' } }

      const filter = filters.builder([filters.in(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where (("foo" in ('bar')))`,
      )
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }

      const filter = filters.builder([filters.in(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name"`)
    })
  })

  describe('prefix', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: 'bar' } }

      const filter = filters.builder([filters.prefix(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where ("foo" like 'bar%' escape '|')`,
      )
    })

    it('returns fulfilled query with escaped values', function() {
      const ctx = { query: { foo: "%_|bar'" } }

      const filter = filters.builder([filters.prefix(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where ("foo" like '|%|_||bar''%' escape '|')`,
      )
    })

    it('returns fulfilled query with escaped values', function() {
      const ctx = { query: { foo: 'bar' } }

      const filter = filters.builder([filters.prefix(ctx, 'foo', 'bar')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where ("bar" like 'bar%' escape '|')`,
      )
    })

    it('returns fulfilled query with transform', function() {
      const ctx = { query: { foo: 'bar' } }

      const filter = filters.builder([
        filters.prefix(ctx, 'foo', 'foo', v => `${v}!!`),
      ])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where ("foo" like 'bar!!%' escape '|')`,
      )
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }

      const filter = filters.builder([filters.prefix(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name"`)
    })
  })

  describe('inPrefix', () => {
    it('returns fulfilled query', function() {
      const ctx = { query: { foo: ["%_|bar'", 'baz'] } }

      const filter = filters.builder([filters.inPrefix(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where ("foo" like any(array('|%|_||bar''%','baz%')) escape '|')`,
      )
    })

    it('returns fulfilled query with db key', function() {
      const ctx = { query: { foo: ['bar'] } }

      const filter = filters.builder([filters.inPrefix(ctx, 'foo', 'bar')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where ("bar" like any(array('bar%')) escape '|')`,
      )
    })

    it('transforms into array', function() {
      const ctx = { query: { foo: 'bar' } }

      const filter = filters.builder([filters.inPrefix(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where ("foo" like any(array('bar%')) escape '|')`,
      )
    })

    it('returns empty object when ctx.query has no query key', function() {
      const ctx = { query: {} }

      const filter = filters.builder([filters.inPrefix(ctx, 'foo')])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(`select * from "table_name"`)
    })
  })

  describe('complex filters', () => {
    it('many filters', function() {
      const ctx = {
        query: {
          eq: 'bar',
          nullEq: null,
          bool: true,
          in: ['bar'],
          prefix: 'bar',
          inPrefix: ['bar'],
          notGreaterEqualThan: 0,
          gt: 1,
          gte: 2,
          lt: 3,
          lte: 4,
        },
      }

      const filter = filters.builder([
        filters.eq(ctx, 'eq'),
        filters.eq(ctx, 'nullEq'),
        filters.bool(ctx, 'bool'),
        filters.in(ctx, 'in'),
        filters.prefix(ctx, 'prefix'),
        filters.inPrefix(ctx, 'inPrefix'),
        filters.negate([filters.gte(ctx, 'notGreaterEqualThan')]),
        filters.gt(ctx, 'gt'),
        filters.gte(ctx, 'gte'),
        filters.lt(ctx, 'lt'),
        filters.lte(ctx, 'lte'),
      ])
      const sql = knex(testTable)
        .select('*')
        .where(filter)
        .toString()
      expect(sql).to.eql(
        `select * from "table_name" where ("eq" = 'bar' and "nullEq" is null and "bool" = true and ("in" in ('bar')) and "prefix" like 'bar%' escape '|' and "inPrefix" like any(array('bar%')) escape '|' and not ("notGreaterEqualThan" >= 0) and "gt" > 1 and "gte" >= 2 and "lt" < 3 and "lte" <= 4)`,
      )
    })
  })
})
