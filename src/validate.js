const moment = require('moment')
const validate = require('validate.js')
const { ObjectId } = require('mongodb')

validate.validators.ref = function(value, options, key, attributes) {
  if (!validate.isDefined(value)) return

  const parts = (value || '').split(':')
  if (parts.length != 2 || parts[0].length < 1 || parts[1].length < 1) {
    return 'is not a valid ref'
  }
}

validate.validators.values = function(values, options) {
  if (!validate.isDefined(values) || !validate.isArray(values)) return

  const result = values.map(value => {
    const fn =
      // if an object and not an array, use normal validate,
      //  if anything else (including arrays), use single
      typeof value === 'object' && !Array.isArray(value)
        ? validate
        : validate.single
    return fn(value, options) || []
  })
  return [].concat(...result)
}

validate.validators.valuesFn = function(values, options) {
  if (!validate.isDefined(values) || !validate.isArray(values) || !options.fn)
    return

  const result = values.map(value => {
    const fn =
      // if an object and not an array, use normal validate,
      //  if anything else (including arrays), use single
      typeof value === 'object' && !Array.isArray(value)
        ? validate
        : validate.single
    return fn(value, options.fn(value)) || {}
  })

  const firstError = result.find(x => Object.keys(x).length > 0)
  if (!firstError) {
    return
  }

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

validate.validators.allowedOnlyIf = function(value, options, key, attributes) {
  if (!options.condition || typeof options.condition !== 'function') {
    throw new Error('You must pass the condition option')
  }
  if (!!value && !options.condition(value, options, key, attributes)) {
    return options.message || 'cannot be sent with given values'
  }
}

validate.validators.uuid = function(value) {
  if (!validate.isDefined(value)) return

  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!regex.test(value)) {
    return 'is not valid uuid'
  }
}

validate.validators.datetimeFormat = function(value, options) {
  const isValid = moment(value, options.format, true).isValid()

  if (!isValid)
    return `is not using an accepted format, it should follow ${options.format}`
}

validate.validators.objectId = function(value) {
  if (!validate.isDefined(value)) return

  const isValid = ObjectId.isValid(value)

  if (!isValid) return 'is not a valid id'
}

validate.extend(validate.validators.datetime, {
  parse: value =>
    moment(value, moment.iso8601, true)
      .utc()
      .toDate(),
  format: (value, options) =>
    moment.utc(value).format(options.dateOnly ? 'YYYY-MM-DD' : moment.iso8601),
})

const koaValidate = async (ctx, data, constraints, transform = v => v) => {
  const errors = validate(data, constraints)

  if (errors) {
    ctx.throw(422, 'Unprocessable Entity', { errors: transform(errors) })
  }
}

module.exports = {
  validate: koaValidate,
  plainValidate: validate,
}
