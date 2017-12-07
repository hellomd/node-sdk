const R = require('ramda')
const { ObjectId } = require('mongodb')

const renameKeys = R.curry((keysMap, obj) =>
  R.reduce((acc, key) => R.assoc(keysMap[key] || key, obj[key], acc), {}, R.keys(obj))
);

const byId = R.compose(R.objOf('_id'), ObjectId)
const fixId = renameKeys({ _id: 'id'})
const set = R.objOf('$set')

module.exports = {
  byId,
  set,
  fixId,
}