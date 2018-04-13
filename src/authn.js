const { promisify } = require('util')
const { sign } = require('jsonwebtoken')

const jwtToken = (claims, secret) =>
  promisify(sign)(claims, secret, { algorithm: 'HS256' })

const expireDate = days => {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  return date
}

const getToken = (id, email, expiresIn, isService = false) =>
  jwtToken(
    {
      id,
      email,
      isService,
      exp: Math.round(expireDate(expiresIn).getTime() / 1000),
    },
    process.env.SECRET,
  )

const serviceTokenMiddleware = async (ctx, next) => {
  const { id, email } = ctx.state.user || {}
  if (id) {
    ctx.state.serviceToken = await getToken(id, email, 1, true)
  }
  await next()
}

module.exports = {
  getToken,
  serviceTokenMiddleware,
}
