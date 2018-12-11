const { format } = require('winston')
const { MESSAGE } = require('triple-beam')
const jsonStringify = require('fast-safe-stringify')

// based on https://github.com/winstonjs/logform/blob/d9d41c5/logstash.js
module.exports = format((info, options) => {
  const { koaCtx } = options

  const obj = {
    environment: process.env.ENV,
    project: process.env.PROJECT_NAME || process.env.APP_NAME,
    commit: process.env.COMMIT_SHA1,
    ...info,
    koa: koaCtx && {
      ...(info && info.koa),
      access: {
        ...(info.koa && info.koa.access),
        remote_ip_list: koaCtx.ips,
        remote_ip: koaCtx.request.ip,
        request_id: koaCtx.state.id,
        // only for basic auth, no need for that
        // user_name:
        method: koaCtx.method,
        url: koaCtx.path,
        referer: koaCtx.headers.referer || null,
        agent: koaCtx.headers['user-agent'] || null,
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
