const R = require('ramda')
const jwt = require('jsonwebtoken')

const { TOKEN_KIND } = require('./authn')

const authn = (id, rest = {}) => req => {
  req.set(
    'Authorization',
    `bearer ${jwt.sign(
      { id, kind: TOKEN_KIND.USER, ...rest },
      process.env.SECRET,
    )}`,
  )
}

const omitId = R.omit(['_id', 'id'])

module.exports = {
  authn,
  omitId,
}
