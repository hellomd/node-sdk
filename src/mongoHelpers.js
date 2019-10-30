const R = require('ramda')
let ObjectId = null
try {
  const mongodb = require('mongodb')
  ObjectId = mongodb.ObjectId
  // eslint-disable-next-line no-empty
} catch (error) {}

const renameKeys = R.curry((keysMap, obj) =>
  R.reduce(
    (acc, key) => R.assoc(keysMap[key] || key, obj[key], acc),
    {},
    R.keys(obj),
  ),
)

const byId = ObjectId
  ? R.compose(
      R.objOf('_id'),
      ObjectId,
    )
  : () => {
      throw new Error('mongodb lib is not installed')
    }
const fixId = renameKeys({ _id: 'id' })
const set = R.objOf('$set')
const pull = R.objOf('$pull')
const push = R.objOf('$push')

module.exports = {
  byId,
  set,
  fixId,
  pull,
  push,
}
