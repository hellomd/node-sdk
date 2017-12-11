const R = require('ramda')
require('mongodb')

module.exports = ({db, collections, label = 'db'}) => async (ctx, next) => {
  ctx[label] = R.map(x => db.collection(x), collections)
  await next()
}