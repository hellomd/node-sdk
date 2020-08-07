function jsonReplacer(key, value) {
  if (typeof value === 'bigint') return value.toString(10)
  if (value instanceof Buffer) return value.toString('base64')
  if (value instanceof Error)
    return {
      message: value.message,
      stack: value.stack,
    }

  return value
}

module.exports = {
  jsonReplacer,
}
