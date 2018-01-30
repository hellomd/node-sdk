const eq = (ctx, queryKey, dbKey = queryKey, transform = v => v) => {
  if (ctx.query[queryKey]) {
    return {
      [dbKey]: transform(ctx.query[queryKey])
    }
  }
  return {}
}

const regExp = (ctx, queryKey, dbKey = queryKey, modifiers = 'i') => {
  return eq(ctx, queryKey, dbKey, value => new RegExp(value, modifiers))
}

/**
 * @apiDefine PublishedFilter
 * @apiParam {Boolean} [published] Published filter e.g. /?published=true
 */
const published = ctx => {
  return eq(ctx, 'published', 'publishedAt', v => {
    if (v === 'false') {
      return null
    }
    return { $ne: null }
  })
}

module.exports = {
  eq,
  regExp,
  published,
}