const { ObjectId } = require('mongodb')

if (process.env.ENV === 'test' || process.env.NODE_ENV === 'test') {
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
  })
}
