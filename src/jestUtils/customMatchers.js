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

    toBeIsoString(received) {
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
