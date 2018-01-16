const moment = require('moment')
const validate = require('validate.js')

validate.validators.ref = function(value, options, key, attributes) {
  const parts = (value || "").split(':')
  if (parts.length != 2 || parts[0].length < 1 || parts[1].length < 1 ) {
    return "is not a valid ref"
  }
}

validate.validators.values = function(values, options) {
  if (!validate.isDefined(values) || !validate.isArray(values)) return

  const result = values.map(value => validate.single(value, options) || [])
  return [].concat(...result)
}

validate.validators.type = function(value, type) {
  if (!validate.isDefined(value)) return

  const types = {
    array: validate.isArray,
    string: validate.isString,
    boolean: validate.isBoolean,
    number: validate.isNumber,
    object: validate.isObject,
  }

  if (types[type] && !types[type](value)) {
    return `value must be of type ${type}`
  }
}

validate.validators.uuid = function(value) {
  if (!validate.isDefined(value)) return

  const regex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
  if (!regex.test(value)) {
    return 'is not valid uuid'
  }
}

validate.extend(validate.validators.datetime, {
  parse: value => moment(value, moment.iso8601, true).utc().toDate(),
  format: (value, options) =>  moment.utc(value).format(options.dateOnly ? 'YYYY-MM-DD' : moment.iso8601)
})

const koaValidate = async (ctx, data, constraints)  =>  {
  const errors = validate(data, constraints)

  if (errors) {
    ctx.throw(422, 'Unprocessable Entity', { errors })
  }
}

module.exports = {
  validate: koaValidate,
  plainValidate: validate
}