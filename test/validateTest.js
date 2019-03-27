const { expect } = require('chai')
const { plainValidate } = require('../src/validate')

const expectError = result =>
  expect(result)
    .to.have.property('foo')
    .that.is.an('array')
    .with.lengthOf(1)

describe('plainValidate', () => {
  describe('values', () => {
    it('passes', () => {
      const constraints = { foo: { values: { presence: true } } }
      const result = plainValidate({ foo: true }, constraints)
      expect(result).to.be.undefined
    })

    it('fails', () => {
      const constraints = {
        foo: { values: { presence: { allowEmpty: false } } },
      }
      const result = plainValidate({ foo: [''] }, constraints)
      expectError(result)
    })

    it('works recursively', () => {
      const constraints = {
        foo: { values: { values: { presence: { allowEmpty: false } } } },
      }
      const result = plainValidate({ foo: [['']] }, constraints)
      expectError(result)
    })

    it('passes with object', () => {
      const constraints = { foo: { values: { bar: { presence: true } } } }
      const result = plainValidate({ foo: [{ bar: 'baz' }] }, constraints)
      expect(result).to.be.undefined
    })

    it('fails with object', () => {
      const constraints = { foo: { values: { bar: { presence: true } } } }
      const result = plainValidate({ foo: [{}] }, constraints)
      expectError(result)
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
      expectError(result)
    })
  })

  describe('uuid', () => {
    it('passes', () => {
      const constraints = { foo: { uuid: true } }
      const result = plainValidate(
        { foo: '416ac246-e7ac-49ff-93b4-f7e94d997e6b' },
        constraints,
      )
      expect(result).to.be.undefined
    })
  })

  describe('objectId', () => {
    it('passes', () => {
      const constraints = {
        foo: {
          objectId: true,
        },
      }
      const result = plainValidate(
        { foo: '5bed8593176c0fc8caf0d0b2' },
        constraints,
      )
      expect(result).to.be.undefined
    })
    it('fails', () => {
      const constraints = {
        foo: {
          objectId: true,
        },
      }
      const result = plainValidate({ foo: 'ABCDEFG' }, constraints)
      expectError(result)
    })
  })

  describe('datetimeFormat', () => {
    it('passes', () => {
      const constraints = {
        foo: {
          datetimeFormat: {
            format: 'HH:mm',
          },
        },
      }
      const result = plainValidate({ foo: '23:29' }, constraints)
      expect(result).to.be.undefined
    })
    it('fails', () => {
      const constraints = {
        foo: {
          datetimeFormat: {
            format: 'HH:mm',
          },
        },
      }
      const result = plainValidate({ foo: '23:60' }, constraints)
      expectError(result)
    })
  })

  describe('allowedOnlyIf', () => {
    it('passes', () => {
      const constraints = {
        bar: {
          presence: true,
        },
        foo: {
          allowedOnlyIf: {
            condition: (value, options, key, attributes) =>
              attributes.bar === 'yes',
          },
        },
      }
      const result = plainValidate({ bar: 'yes', foo: 'allowed' }, constraints)
      expect(result).to.be.undefined
    })

    it('fails', () => {
      const constraints = {
        bar: {
          presence: true,
        },
        foo: {
          allowedOnlyIf: {
            condition: (value, options, key, attributes) =>
              attributes.bar === 'yes',
          },
        },
      }
      const result = plainValidate(
        { bar: 'no', foo: 'not allowed' },
        constraints,
      )
      expectError(result)
    })
  })

  describe('validateOnlyIf', () => {
    it('passes', () => {
      const constraints = {
        bar: {
          presence: true,
        },
        foo: {
          validateOnlyIf: {
            condition: (value, options, key, attributes) =>
              attributes.bar === 'yes',
            constraints: {
              type: 'number',
              presence: { allowEmpty: false },
            },
          },
        },
      }
      const result = plainValidate({ bar: 'yes', foo: 1 }, constraints)
      expect(result).to.be.undefined
    })

    it('fails', () => {
      const constraints = {
        bar: {
          presence: true,
        },
        foo: {
          validateOnlyIf: {
            condition: (value, options, key, attributes) =>
              attributes.bar === 'yes',
            constraints: {
              type: 'number',
              presence: { allowEmpty: false },
            },
          },
        },
      }
      const result = plainValidate({ bar: 'yes' }, constraints)
      expectError(result)
    })
  })
})
