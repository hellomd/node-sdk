module.exports =
  process.env.JEST_WORKER_ID !== undefined &&
  (process.env.ENV === 'test' || process.env.NODE_ENV === 'test')
