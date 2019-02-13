const R = require('ramda')
const jwt = require('jsonwebtoken')

const authn = (id, rest = {}) => req => {
  req.set(
    'Authorization',
    `bearer ${jwt.sign({ id, ...rest }, process.env.SECRET)}`,
  )
}

const omitId = R.omit(['_id', 'id'])

module.exports = {
  authn,
  omitId,
}
