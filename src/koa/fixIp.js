const fixIp = () => async (ctx, next) => {
  const { app } = ctx

  // request forwaded by caddy
  const isCaddy = ctx.get('x-forwarded-server').startsWith('gateway-')

  if (app.proxy && isCaddy) {
    // Caddy transparent directive forwards all ips given by client on
    //  X-Forwaded-For, Koa adds those to .ips, and picks the first one and mark it
    //  as the real client ip
    // But we don't want that, we want it to use the X-Real-Ip provided by caddy instead
    // If not available, use last ip on ctx.ips, since the ones prepend there, are client passed ones
    //  which can be spoofed
    // If all fails, leave it to their current value
    ctx.request.ip =
      ctx.get('x-real-ip') ||
      ((ctx.ips && ctx.ips[ctx.ips.length - 1]) || ctx.ip)
  }

  return next()
}

module.exports = {
  fixIp,
}
