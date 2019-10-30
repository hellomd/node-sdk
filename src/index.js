// order here is important, this must come first than everything else
const { apmAgent, shouldUseApm } = require('./apmAgent')

const api = require('./api')
const apiMock = require('./apiMock')
const amqp = require('./amqp')
const authn = require('./authn')
const authz = require('./authz')
const { axios, axiosMock } = require('./axios')
const gracefulShutdown = require('./gracefulShutdown')
const jestUtils = require('./jestUtils')
const jobs = require('./jobs')
const koa = require('./koa')
const logging = require('./logging')
const postgres = require('./postgres')
const mongo = require('./mongo')
const mongoHelpers = require('./mongoHelpers')
const paginate = require('./paginate')
const { validate, plainValidate } = require('./validate')
const recovery = require('./recovery')
const sort = require('./sort')
const utils = require('./utils')
const testHelpers = require('./testHelpers')
const testPresets = require('./testPresets')

module.exports = {
  ...api,
  ...apiMock,
  amqp,
  apmAgent,
  shouldUseApm,
  authn,
  authz,
  axios,
  axiosMock,
  gracefulShutdown,
  jestUtils,
  jobs,
  koa,
  logging,
  postgres,
  mongo,
  mongoHelpers,
  paginate,
  plainValidate,
  recovery,
  sort,
  utils,
  testHelpers,
  testPresets,
  validate,
}
