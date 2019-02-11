const { format } = require('winston')
const { MESSAGE } = require('triple-beam')
const jsonStringify = require('fast-safe-stringify')

const { jsonReplacer } = require('./utils')

// based on https://github.com/winstonjs/logform/blob/d9d41c5/logstash.js
module.exports = format(({ meta, ...info }, options) => {
  const { koaCtx, metadata } = options

  const obj = {
    environment: process.env.ENV,
    project: process.env.PROJECT_NAME || process.env.APP_NAME,
    resource: process.env.PROJECT_RESOURCE || 'app',
    commit: process.env.COMMIT_SHA1,
    ...info,
    user: koaCtx &&
      koaCtx.state &&
      koaCtx.state.user && {
        id: koaCtx.state.user.id,
        email: koaCtx.state.user.email,
      },
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
    ...metadata,
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
  info[MESSAGE] = jsonStringify(obj, jsonReplacer)
  return info
})
