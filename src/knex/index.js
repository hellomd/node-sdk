const { attachPaginate } = require('./attachPaginateinate')
const { filters } = require('./filters')
const { setupPg } = require('./setupPg')
const { sort } = require('./sort')

module.exports = {
  attachPaginate,
  filters,
  setupPg,
  sort,
}
