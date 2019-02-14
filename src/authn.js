const { promisify } = require('util')
const { sign, verify } = require('jsonwebtoken')

const TOKEN_KIND = {
  ANONYMOUS: 'anonymous',
  USER: 'user',
  SERVICE: 'service',
}

const jwtToken = (claims, secret) =>
  promisify(sign)(claims, secret, { algorithm: 'HS256' })

const expireDate = days => {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  return date
}

const verifyToken = token =>
  new Promise((resolve, reject) => {
    verify(token, process.env.SECRET, (error, decoded) => {
      error ? reject(error) : resolve(decoded)
    })
  })

const getToken = (
  id,
  email,
  expiresIn,
  isService = false,
  appName = process.env.APP_NAME,
) => {
  if (isService && process.env.ENV === 'test') return 'serviceToken'

  const kind = isService ? TOKEN_KIND.SERVICE : TOKEN_KIND.USER
  const exp = Math.round(expireDate(expiresIn).getTime() / 1000)
  const data = id
    ? {
        id,
        email,
        isService,
        exp,
        kind,
      }
    : { appName, isService, exp, kind }
  return jwtToken(data, process.env.SECRET)
}

const getAnonymousToken = id => {
  return jwtToken(
    {
      id,
      kind: TOKEN_KIND.ANONYMOUS,
    },
    process.env.SECRET,
  )
}

const serviceTokenMiddleware = async (ctx, next) => {
  const { id = null, email = null } = ctx.state.user || {}
  ctx.state.serviceToken = await getToken(id, email, 1, true)
  await next()
}

module.exports = {
  getToken,
  getAnonymousToken,
  serviceTokenMiddleware,
  TOKEN_KIND,
  verifyToken,
}
