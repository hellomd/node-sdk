const moment = require('moment')
const validate = require('validate.js')
const R = require('ramda')

let ObjectId = null
try {
  const mongodb = require('mongodb')
  ObjectId = mongodb.ObjectId
  // eslint-disable-next-line no-empty
} catch (error) {}

const {
  uuidRegex,
  uuidRegexNonStrict,
  uuidV1Regex,
  uuidV4Regex,
} = require('./utils')

const defaultRefResourceIdValidator = {
  uuidV1: { message: 'does not have a valid resource uuid' },
}

validate.validators.ref = function(value, options, _key, _attributes) {
  if (!validate.isDefined(value)) return

  if (!validate.isString(value)) return 'must be a string'

  options = validate.extend({}, this.options, options)

  const {
    resourceKindConstraint,
    resourceIdConstraint = defaultRefResourceIdValidator,
  } = options

  const parts = (value || '').split(':')
  let [resourceKind, resourceId] = parts

  resourceKind = resourceKind && resourceKind.trim()
  resourceId = resourceId && resourceId.trim()

  if (parts.length !== 2 || !resourceKind || !resourceId)
    return (
      options.notValidRef ||
      this.notValidRef ||
      options.message ||
      this.message ||
      'is not a valid ref'
    )

  if (resourceKindConstraint) {
    const resourceKindValidationResult = validate(
      { resourceKind },
      {
        resourceKind: resourceKindConstraint,
      },
    )
    if (resourceKindValidationResult)
      return resourceKindValidationResult.resourceKind
  }

  if (resourceIdConstraint) {
    const resourceIdValidationResult = validate(
      { resourceId },
      { resourceId: resourceIdConstraint },
    )
    if (resourceIdValidationResult) return resourceIdValidationResult.resourceId
  }
}

validate.validators.values = function(
  values,
  options,
  key,
  attributes,
  globalOptions,
) {
  if (!validate.isDefined(values)) return

  if (!validate.isArray(values)) return 'must be an array'

  options = validate.extend({}, this.options, options)

  const { constraints, isArrayOfObjects } = options

  // old version
  if (!constraints) {
    const result = values.map(value => {
      const fn =
        // if an object and not an array, use normal validate,
        //  if anything else (including arrays), use single
        typeof value === 'object' && !Array.isArray(value) && !!value
          ? validate
          : validate.single
      return fn(value, options) || []
    })
    return [].concat(...result)
  } else {
    const result = values.map((value, idx) => {
      if (isArrayOfObjects && (Array.isArray(value) || !value))
        return ['element must be an object']

      const fn = isArrayOfObjects ? validate : validate.single
      return (
        fn(
          value,
          typeof options.constraints === 'function'
            ? options.constraints(
                value,
                idx,
                values,
                options,
                key,
                attributes,
                globalOptions,
              )
            : options.constraints,
        ) || []
      )
    })

    const hasErrors = R.flatten(result || []).length > 0

    return hasErrors ? [].concat(...result) : undefined
  }
}

// Deprecated, do not use
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

validate.validators.type = function(value, typeOrOptions) {
  if (!validate.isDefined(value)) return

  let options =
    typeof typeOrOptions === 'string' ? { type: typeOrOptions } : typeOrOptions
  options = validate.extend({}, this.options, options)

  const { type } = options

  const types = {
    array: validate.isArray,
    string: validate.isString,
    boolean: validate.isBoolean,
    number: validate.isNumber,
    object: validate.isObject,
  }

  if (!type || !types[type])
    throw new Error(
      `Invalid type option, must be one of ${Object.keys(types).join(', ')}`,
    )

  if (!types[type](value)) {
    const errorMessage =
      options.message || this.message || 'value must be of type %{type}'

    return validate.format(errorMessage, { type })
  }
}

validate.validators.allowedOnlyIf = function(value, options, key, attributes) {
  options = validate.extend({}, this.options, options)

  if (!options.condition || typeof options.condition !== 'function') {
    throw new Error('You must pass the condition option')
  }

  if (!validate.isDefined(value)) return

  if (!options.condition(value, options, key, attributes)) {
    return options.message || this.message || 'cannot be sent with given values'
  }
}

validate.validators.validateOnlyIf = function(value, options, key, attributes) {
  options = validate.extend({}, this.options, options)

  const { condition, isObject } = options
  let { constraints } = options

  if (!constraints) {
    throw new Error('You must pass the constraints option')
  }

  constraints =
    typeof constraints === 'function'
      ? constraints(value, options, key, attributes)
      : constraints

  if (!constraints) {
    throw new Error(
      'Result from the constraints function passed as option must be an object',
    )
  }

  if (!condition || typeof condition !== 'function') {
    throw new Error('You must pass the condition option')
  }
  if (condition(value, options, key, attributes)) {
    const fn = isObject ? validate : validate.single
    return fn(value, constraints)
  }
}

validate.validators.uuid = function(value, options) {
  options = validate.extend(
    {
      strict: true,
    },
    this.options,
    options,
  )

  if (!validate.isDefined(value)) return

  const regex = options.strict ? uuidRegex : uuidRegexNonStrict
  if (!regex.test(value)) {
    return options.message || this.message || 'is not valid uuid'
  }
}

validate.validators.uuidV1 = function(value, options) {
  if (!validate.isDefined(value)) return

  options = validate.extend({}, this.options, options)

  const isValid = uuidV1Regex.test(value)

  if (!isValid) return options.message || this.message || 'is not a valid uuid'
}

validate.validators.uuidV4 = function(value, options) {
  if (!validate.isDefined(value)) return

  options = validate.extend({}, this.options, options)

  const isValid = uuidV4Regex.test(value)

  if (!isValid) return options.message || this.message || 'is not a valid uuid'
}

validate.validators.datetimeFormat = function(value, options) {
  if (!validate.isDefined(value)) return

  if (!validate.isString(value)) return 'must be a string'

  options = validate.extend({}, this.options, options)

  const isValid = moment(value, options.format, true).isValid()

  if (!isValid)
    return (
      options.message ||
      this.message ||
      `is not using an accepted format, it should follow ${options.format}`
    )
}

validate.validators.objectId = function(value, options) {
  if (!validate.isDefined(value)) return

  options = validate.extend({}, this.options, options)

  if (!ObjectId) throw new Error('mongodb lib is not installed')

  const isValid = ObjectId.isValid(value)

  if (!isValid) return options.message || this.message || 'is not a valid id'
}

validate.extend(validate.validators.datetime, {
  parse: value =>
    moment(value, moment.iso8601, true)
      .utc()
      .toDate(),
  format: (value, options) =>
    moment.utc(value).format(options.dateOnly ? 'YYYY-MM-DD' : moment.iso8601),
})

const koaValidate = (ctx, data, constraints, transform = v => v) => {
  const errors = validate(data, constraints, { ctx })

  if (errors) {
    ctx.throw(422, 'Unprocessable Entity', { errors: transform(errors) })
  }
}

module.exports = {
  validate: koaValidate,
  plainValidate: validate,
}
