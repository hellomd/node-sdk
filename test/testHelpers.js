const Koa = require('koa')

const servers = []

const createServer = () => {
  const app = new Koa()
  const server = app.listen()
  servers.push(server)
  return { app, server }
}

after(() => servers.map(server => server.close()))

module.exports = {
  createServer,
}