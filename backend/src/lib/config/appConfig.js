const debug = require('debug')('api:appConfig')
const url = (req) => `${req.protocol}://${req.get('host')}`

exports.trimParams = (req, res, next) => {
  debug('API : ', `${url(req)}${req.url}`)

  for (const i in req.body) {
    if (typeof req.body[i] === 'string') {
      req.body[i] = req.body[i].trim()
    }
  }

  for (const i in req.query) {
    if (typeof req.query[i] === 'string') {
      req.query[i] = req.query[i].trim()
    }
  }

  debug('req.method : ', req.method)
  debug('req.body : ', req.body)
  debug('req.query : ', req.query)
  next()
}

exports.handleError = async (err, req, res, next) => {
  if (!err) { return next() }
  const errorResponse = {
    stack: err.stack, ...(err.output && err.output.payload ? err.output.payload : err),
  }
  debug('Error stack :: ')
  debug(err.stack)

  if (err.output && (err.output.statusCode === 406 || err.output.statusCode === 500)) {
    const { originalUrl } = req
    const appName = originalUrl && originalUrl.split('/')[2]
    let errDesc = ''
    if (err?.data?.original) {
      errDesc = err.data.original.stack + err.data.stack
    } else if (err.data) {
      errDesc = err.data.stack
    } else {
      errDesc = err.stack
    }
    const errorLogParams = {
      ErrorDescription: errDesc,
      ErrorDate: Date.now(),
      UserId: null,
      AppName: appName,
      AddedOn: Date.now(),
    }
  }

  const statusCode = err.output && err.output.statusCode ? err.output.statusCode : 500
  return res.status(statusCode).json(errorResponse)
}
