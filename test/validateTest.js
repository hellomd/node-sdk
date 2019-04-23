const { expect } = require('chai')
const { plainValidate } = require('../src/validate')

const expectError = (result, length = 1) =>
  expect(result)
    .to.have.property('foo')
    .that.is.an('array')
    .with.lengthOf(length)

describe('plainValidate', () => {
  describe('values', () => {
    it('passes', () => {
      const constraints = { foo: { values: { presence: true } } }
      const result = plainValidate({ foo: [] }, constraints)
      expect(result).to.be.undefined
    })

    it('fails with no array', () => {
      const constraints = {
        foo: { values: { presence: { allowEmpty: false } } },
      }
      const result = plainValidate({ foo: true }, constraints)
      expectError(result)
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

    it('pass with value null', () => {
      const constraints = { foo: { values: { type: 'number' } } }
      const result = plainValidate({ foo: [null] }, constraints)
      expect(result).to.be.undefined
    })

    it('pass with custom constraints using function', () => {
      const customConstraints = {
        first: { type: 'number' },
        _: { type: 'string' },
      }

      const constraints = {
        foo: {
          values: {
            constraints: (value, index) =>
              index === 0 ? customConstraints.first : customConstraints._,
          },
        },
      }

      const result = plainValidate({ foo: [1, 'a', 'b'] }, constraints)
      expect(result).to.be.undefined
    })

    it('[deprecated] fails with object', () => {
      const constraints = { foo: { values: { bar: { presence: true } } } }
      const result = plainValidate({ foo: [{}] }, constraints)
      expectError(result)
    })

    it('[deprecated] passes with object', () => {
      const constraints = { foo: { values: { bar: { presence: true } } } }
      const result = plainValidate({ foo: [{ bar: 'baz' }] }, constraints)
      expect(result).to.be.undefined
    })

    // above are deprecated because of this bug:
    // it('[deprecated] does not work', () => {
    //   const constraints = { foo: { values: { bar: { presence: true } } } }
    //   const result = plainValidate({ foo: [null, { bar: 'baz' }] }, constraints)
    //   // throws an error
    // })

    it('pass with object', () => {
      const constraints = {
        foo: {
          values: {
            isArrayOfObjects: true,
            constraints: {
              a: { type: 'number', presence: { allowEmpty: false } },
            },
          },
        },
      }
      const result = plainValidate({ foo: [{ a: 1 }, { a: 2 }] }, constraints)
      expect(result).to.be.undefined
    })

    it('fails with object with null value and missing key', () => {
      const constraints = {
        foo: {
          values: {
            isArrayOfObjects: true,
            constraints: {
              a: { type: 'number', presence: { allowEmpty: false } },
            },
          },
        },
      }
      const result = plainValidate({ foo: [null, {}] }, constraints)

      expectError(result, 2)
    })

    it('fails with object with null value', () => {
      const constraints = {
        foo: {
          values: {
            isArrayOfObjects: true,
            constraints: { a: { type: 'number' } },
          },
        },
      }
      const result = plainValidate({ foo: [null, {}] }, constraints)

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

  describe('ref', () => {
    it('passes', () => {
      const constraints = {
        foo: {
          ref: true,
        },
      }
      const result = plainValidate(
        { foo: 'a:5bed8593176c0fc8caf0d0b2' },
        constraints,
      )
      expect(result).to.be.undefined
    })

    it('fails with missing resource kind', () => {
      const constraints = {
        foo: {
          ref: true,
        },
      }
      const result = plainValidate(
        { foo: '  :5bed8593176c0fc8caf0d0b2' },
        constraints,
      )
      expectError(result)
    })

    it('fails with missing resource id', () => {
      const constraints = {
        foo: {
          ref: true,
        },
      }
      const result = plainValidate({ foo: 'abc:  ' }, constraints)

      expectError(result)
    })

    it('fails with non ref string', () => {
      const constraints = {
        foo: {
          ref: true,
        },
      }
      const result = plainValidate({ foo: 'abcdefg' }, constraints)

      expectError(result)
    })

    it('fails with non objectid resource id because of default id constraint', () => {
      const constraints = {
        foo: {
          ref: true,
        },
      }
      const result = plainValidate({ foo: 'abc:abcdefg' }, constraints)

      expectError(result)
    })

    it('fails with custom resource id constraint', () => {
      const constraints = {
        foo: {
          ref: {
            resourceIdConstraint: {
              length: { is: 2 },
            },
          },
        },
      }
      const result = plainValidate(
        { foo: 'abc:5bed8593176c0fc8caf0d0b2' },
        constraints,
      )
      expectError(result)
    })

    it('fails with custom resource kind constraint', () => {
      const constraints = {
        foo: {
          ref: {
            resourceKindConstraint: {
              inclusion: ['a', 'b', 'c'],
            },
          },
        },
      }
      const result = plainValidate(
        { foo: 'd:5bed8593176c0fc8caf0d0b2' },
        constraints,
      )
      expectError(result)
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

    it('pass with value null', () => {
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
            },
          },
        },
      }
      const result = plainValidate({ bar: 'yes', foo: null }, constraints)
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
