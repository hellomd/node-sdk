const { verifyToken } = require('../authn')

// copied from:
//  https://github.com/koajs/jwt/blob/51efb1f5/lib/resolvers/auth-header.js#L10-L28
function getTokenCredentialsFromHeader(ctx) {
  if (!ctx.header || !ctx.header.authorization) {
    return
  }

  const parts = ctx.header.authorization.split(' ')

  if (parts.length === 2) {
    const scheme = parts[0]
    const credentials = parts[1]

    if (/^Bearer$/i.test(scheme)) {
      return credentials
    }
  }
}
async function getUserFromCtxOrHeaderIfAny(ctx) {
  const userAlreadyOnCtx = ctx &&
    ctx.state &&
    ctx.state.user && {
      id: ctx.state.user.id,
      email: ctx.state.user.email,
      appName: ctx.state.user.appName,
      kind: ctx.state.user.kind,
    }

  if (userAlreadyOnCtx) return userAlreadyOnCtx

  const token = getTokenCredentialsFromHeader(ctx)

  if (!token) return

  try {
    const obj = await verifyToken(token)
    return {
      id: obj.id,
      email: obj.email,
      appName: obj.appName,
      kind: obj.kind,
    }
  } catch (error) {
    return
  }
}

module.exports = {
  getUserFromCtxOrHeaderIfAny,
}
