const R = require('ramda')
require('mongodb')

module.exports = ({db, collections}) => async (ctx, next) => {
  ctx.db = R.map(x => db.collection(x), collections)
  await next()
}