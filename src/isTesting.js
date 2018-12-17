module.exports = {
  isTesting: process.env.ENV === 'test' || process.env.NODE_ENV === 'test',
}
