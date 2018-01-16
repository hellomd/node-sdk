const { expect } = require('chai')
const { plainValidate } = require('../src/validate')

describe('plainValidate', () => {
  describe('values', () => {
    it('passes', () => {
      const constraints = { foo: { values: { presence: true } } }
      const result = plainValidate({ foo: true }, constraints)
      expect(result).to.be.undefined
    })

    it('fails', () => {
      const constraints = { foo: { values: { presence: { allowEmpty: false } } } }
      const result = plainValidate({ foo: [''] }, constraints)
      expect(result)
        .to.have.property('foo')
        .that.is.an('array')
        .with.lengthOf(1)
    })

    it('works recursively', () => {
      const constraints = { foo: { values: { values: { presence: { allowEmpty: false } } } } }
      const result = plainValidate({ foo: [['']] }, constraints)
      expect(result)
        .to.have.property('foo')
        .that.is.an('array')
        .with.lengthOf(1)
    })
  })

  describe('type', () => {
    it('passes', () => {
      const constraints = { foo: { type: 'array' } }
      const result = plainValidate({ foo: [] }, constraints)
      expect(result).to.be.undefined
    })

    it('fails', () => {
      const constraints = { foo: { type: 'array' } }
      const result = plainValidate({ foo: true }, constraints)
      expect(result)
        .to.have.property('foo')
        .that.is.an('array')
        .with.lengthOf(1)
    })
  })
})