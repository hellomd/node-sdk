const validate = require('validate.js')

validate.validators.ref = function(value, options, key, attributes) {
  const parts = (value || "").split(':')
  if (parts.length != 2 || parts[0].length < 1 || parts[1].length < 1 ) {
    return "is not a valid ref"
  }
}

const koaValidate = async (ctx, data, constraints)  =>  {
  const errors = validate(data, constraints)
  
  if (errors) {
    ctx.status = 422
    ctx.body = errors
    return false
  }

  return true
}

module.exports = {
  validate: koaValidate,
  plainValidate: validate
}