let ObjectId = null

try {
  const mongodb = require('mongodb')
  ObjectId = mongodb.ObjectId
  // eslint-disable-next-line no-empty
} catch (error) {}

const moment = require('moment')

const { uuidV1Regex, uuidV4Regex } = require('../utils')

const isJestRunning = require('./isJestRunning')

if (isJestRunning) {
  expect.extend({
    toBeObjectId(received) {
      const pass = !!ObjectId && !!ObjectId.isValid(received)
      return {
        message: () =>
          pass
            ? `expected ${received} not to be a valid ObjectId`
            : `expected ${received} to be a valid ObjectId`,
        pass,
      }
    },
    toBeUuidV1(received) {
      const pass = !!received && uuidV1Regex.test(received)
      return {
        message: () =>
          pass
            ? `expected ${received} not to be a valid uuid v1`
            : `expected ${received} to be a valid uuid v1`,
        pass,
      }
    },
    toBeUuidV4(received) {
      const pass = !!received && uuidV4Regex.test(received)
      return {
        message: () =>
          pass
            ? `expected ${received} not to be a valid uuid v4`
            : `expected ${received} to be a valid uuid v4`,
        pass,
      }
    },
    // strict means that if we are testing not.toBeResourceRef it will still check if it's a valid ref
    toBeResourceRef(received, resourceKind, resourceId) {
      const isString = typeof received === 'string'
      const pieces = isString ? received.split(':') : []

      const isValid = pieces.length === 2 && ObjectId.isValid(pieces[1])

      if (
        typeof resourceKind === 'undefined' &&
        typeof resourceId === 'undefined'
      ) {
        return {
          message: () =>
            isValid
              ? `expected ${received} not to be a valid resource ref string`
              : `expected ${received} to be a valid resource ref string`,
          pass: isValid,
        }
      }

      let pass = isValid
      let message = pass
        ? `expected ${received} not to be a valid resource ref string`
        : `expected ${received} to be a valid resource ref string`

      const [receivedResourceKind, receivedResourceId] = pieces

      if (resourceKind) {
        pass = pass && receivedResourceKind === resourceKind
        message = `${message}, with resource kind of ${resourceKind}`
      }

      if (resourceId) {
        pass = pass && receivedResourceId === resourceId
        message = `${message} and resource id of ${resourceId}`
      }

      return {
        message: () => message,
        pass,
      }
    },

    toBeISOString(received) {
      const pass = moment(received, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).isValid()
      return {
        message: () =>
          pass
            ? `expected ${received} not to be a valid date ISO string`
            : `expected ${received} to be a valid date ISO string`,
        pass,
      }
    },
  })
}
