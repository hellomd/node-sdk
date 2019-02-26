const { ObjectId } = require('mongodb')
const moment = require('moment')

const isJestRunning = require('./isJestRunning')

if (isJestRunning) {
  expect.extend({
    toBeObjectId(received) {
      const pass = !!ObjectId.isValid(received)
      return {
        message: () =>
          pass
            ? `expected ${received} not to be a valid ObjectId`
            : `expected ${received} to be a valid ObjectId`,
        pass,
      }
    },

    // strict means that if we are testing not.toBeResourceRef it will still check if it's a valid ref
    toBeResourceRef(received, resourceKind, resourceId) {
      const isString = typeof received === 'string'
      const pieces = isString ? received.split(':') : []

      const isValid = pieces.length === 2 && Object.isValid(pieces[1])

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
