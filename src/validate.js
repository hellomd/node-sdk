const moment = require('moment')
const validate = require('validate.js')

validate.validators.ref = function(value, options, key, attributes) {
  const parts = (value || "").split(':')
  if (parts.length != 2 || parts[0].length < 1 || parts[1].length < 1 ) {
    return "is not a valid ref"
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