const axios = require('axios')
let axiosMock

if (process.env.ENV === 'test') {
  const Mock = require('axios-mock-adapter')
  axiosMock = new Mock(axios)
}

module.exports = {
  axiosMock,
  axios
}