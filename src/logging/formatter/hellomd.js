const { format } = require('winston')
const { MESSAGE } = require('triple-beam')
const jsonStringify = require('fast-safe-stringify')

// based on https://github.com/winstonjs/logform/blob/d9d41c5/logstash.js
module.exports = format((info, options) => {
  const { ctx } = options

  const obj = {
    environment: process.env.ENV,
    application_name: process.env.APP_NAME,
    ...info,
    koa: ctx && {
      ...(info && info.koa),
      access: {
        ...(info.koa && info.koa.access),
        remote_ip_list: ctx.ips,
        remote_ip: ctx.request.ip,
        request_id: ctx.state.id,
        // only for basic auth, no need for that
        // user_name:
        method: ctx.method,
        url: ctx.path,
        referrer: ctx.headers.referer || null,
        agent: ctx.headers['user-agent'] || null,
      },
    },
  }
  // if (info.message) {
  //   obj['@message'] = info.message;
  //   delete info.message;
  // }

  if (obj.timestamp) {
    obj['@timestamp'] = obj.timestamp
    delete obj.timestamp
  }

  // obj['@fields'] = info
  info[MESSAGE] = jsonStringify(obj)
  return info
})
