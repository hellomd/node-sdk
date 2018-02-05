const { expect } = require('chai')
const { ObjectId } = require('mongodb')
const {
  nullify,
  nullOrDateString,
  nullOrDate,
  nullOrObjectId,
  nullOrToString,
  times,
  randomInt,
  sample,
} = require('../src/utils')

describe('utils', () => {
  describe('nullify', () => {
    it('transforms undefined object values in null', function() {
      const obj = { foo: 'bar', baz: undefined }
      expect(nullify(obj)).to.eql({ foo: 'bar', baz: null })
    })
  })

  describe('nullOrDateString', () => {
    it('returns null', function() {
      expect(nullOrDateString(null)).to.equal(null)
    })

    it('returns date string', function() {
      const date = new Date(1517586505919)
      expect(nullOrDateString(date)).to.equal('2018-02-02T15:48:25.919Z')
    })
  })

  describe('nullOrDate', () => {
    it('returns null', function() {
      expect(nullOrDate(null)).to.equal(null)
    })

    it('returns date with date', function() {
      const date = new Date(1517586505919)
      expect(nullOrDate(date)).to.eql(date)
    })

    it('returns date with number', function() {
      const number = 1517586505919
      expect(nullOrDate(number)).to.eql(new Date(number))
    })

    it('returns date with string', function() {
      const string = '2018-01-01T20:00:00Z'
      expect(nullOrDate(string)).to.eql(new Date(string))
    })
  })

  describe('nullOrObjectId', () => {
    it('returns null', function() {
      expect(nullOrObjectId(null)).to.equal(null)
    })

    it('returns ObjectId with string', function() {
      const id = '5a7489765411ea6aae3a084c'
      expect(nullOrObjectId(id)).to.eql(ObjectId('5a7489765411ea6aae3a084c'))
    })

    it('returns ObjectId with ObjectId', function() {
      const id = ObjectId('5a7489765411ea6aae3a084c')
      expect(nullOrObjectId(id)).to.equal(id)
    })
  })

  describe('nullOrToString', () => {
    it('returns null', function() {
      expect(nullOrToString(null)).to.equal(null)
    })

    it('returns string with number', function() {
      const number = 1
      expect(nullOrToString(number)).to.equal('1')
    })
  })
})
