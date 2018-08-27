require('mongodb')

module.exports = (db, collections) =>
  Object.entries(collections).reduce(
    (acc, [k, v]) => ({
      ...acc,
      [k]: db.db().collection(v),
    }),
    {},
  )
