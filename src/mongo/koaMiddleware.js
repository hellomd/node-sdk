const mapCollections = require('./mapCollections')

module.exports = ({ db, collections, label = 'db' }) => async (ctx, next) => {
  ctx[label] = mapCollections(db, collections)
  await next()
}
