// order here is important, this must come first than everything else
const { apmAgent, shouldUseApm } = require('./apmAgent')

const api = require('./api')
const apiMock = require('./apiMock')
const amqp = require('./amqp')
const authn = require('./authn')
const authz = require('./authz')
const { axios, axiosMock } = require('./axios')
const filters = require('./filters')
const koa = require('./koa')
const logger = require('./logger')
const logging = require('./logging')
const mongo = require('./mongo')
const mongoHelpers = require('./mongoHelpers')
const paginate = require('./paginate')
const { validate, plainValidate } = require('./validate')
const recovery = require('./recovery')
const sentry = require('./sentry')
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
  filters,
  koa,
  logger,
  logging,
  mongo,
  mongoHelpers,
  paginate,
  plainValidate,
  recovery,
  sentry,
  sort,
  utils,
  testHelpers,
  testPresets,
  validate,
}
