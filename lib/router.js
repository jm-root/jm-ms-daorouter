var _ = require('lodash')
const error = require('jm-err')
const event = require('jm-event')
const log = require('jm-log4js')
const MS = require('jm-ms-core')
var ms = new MS()
var Err = error.Err
var logger = log.logger

module.exports = function (dao, opts) {
  var router = ms.router(opts)
  event.enableEvent(dao)

  opts || (opts = {})
  opts.list || (opts.list = {})
  opts.get || (opts.get = {})

  dao.routes || (dao.routes = {})
  var routes = dao.routes

  routes.opts = opts

  routes.done = function (opts, cb) {
    var err = opts.err
    var doc = opts.doc
    if (err) {
      logger.error(err.stack)
      if (!doc.err) {
        doc = {
          err: err.code,
          msg: err.message
        }
      }
    }
    cb(err, doc || error.Err.FA_NOTFOUND)
  }

  routes.before_list = function (opts, cb, next) { next() }
  routes.after_list = function (opts, cb, next) { next() }
  routes.list = function (opts, cb, next) {
    dao.emit('before_list', opts, cb)
    var optsList = _.cloneDeep(routes.opts.list)
    var populations = opts.populations || optsList.populations || null
    var page = opts.data.page
    var rows = opts.data.rows
    var conditions = opts.conditions || optsList.conditions || null
    var options = opts.options || optsList.options || {}
    var fields = opts.fields || optsList.fields || null
    var sidx = opts.data.sidx
    var sord = opts.data.sord
    var lean = true
    if (opts.lean === false) {
      lean = false
    } else if (optsList.lean === false) {
      lean = false
    }
    if (sidx) {
      options.sort = []
      var o = {}
      o[sidx] = -1
      if (sord == 'asc') {
        o[sidx] = 1
      }
      options.sort.push(o)
    }

    dao.find2({
      populations: populations,
      conditions: conditions,
      fields: fields,
      options: options,
      lean: lean,
      page: page,
      rows: rows
    }, function (err, doc) {
      opts.err = err
      if (page || rows) {
        opts.doc = doc
      } else {
        opts.doc = {rows: doc}
      }
      dao.emit('list', opts, cb)
      next()
    })
  }

  routes.before_get = function (opts, cb, next) { next() }
  routes.after_get = function (opts, cb, next) { next() }
  routes.get = function (opts, cb, next) {
    dao.emit('before_get', opts, cb)
    var id = opts.params.id
    var optsGet = _.cloneDeep(routes.opts.get)
    var populations = opts.populations || optsGet.populations || null
    var options = opts.options || optsGet.options || {}
    var fields = opts.fields || optsGet.fields || null
    var lean = true
    if (opts.lean === false) {
      lean = false
    } else if (optsGet.lean === false) {
      lean = false
    }
    dao.findById2(
      id,
      {
        populations: populations,
        fields: fields,
        options: options,
        lean: lean
      },
      function (err, doc) {
        opts.err = err
        opts.doc = doc
        dao.emit('get', opts, cb)
        next()
      }
    )
  }

  routes.before_create = function (opts, cb, next) { next() }
  routes.after_create = function (opts, cb, next) { next() }
  routes.create = function (opts, cb, next) {
    dao.emit('before_create', opts, cb)
    var data = opts.data
    dao.create(data, function (err, doc) {
      opts.err = err
      opts.doc = doc
      dao.emit('create', opts, cb)
      next()
    })
  }

  routes.before_update = function (opts, cb, next) { next() }
  routes.after_update = function (opts, cb, next) { next() }
  routes.update = function (opts, cb, next) {
    dao.emit('before_update', opts, cb)
    var id = opts.params.id
    var data = opts.data
    dao.update({_id: id}, data, function (err, doc) {
      if (!err && doc && doc.ok) {
        doc = {ret: doc.n, modified: doc.nModified}
      }
      opts.err = err
      opts.doc = doc
      dao.emit('update', opts, cb)
      next()
    })
  }

  routes.before_remove = function (opts, cb, next) { next() }
  routes.after_remove = function (opts, cb, next) { next() }
  routes.remove = function (opts, cb, next) {
    dao.emit('before_remove', opts, cb)
    var id = opts.params.id || opts.data.id
    if (id instanceof Array) {
    } else {
      id = id.split(',')
    }
    dao.remove({_id: {$in: id}}, function (err, doc) {
      opts.err = err
      if (!err && doc && doc.result && doc.result.ok) {
        doc = {ret: doc.result.n}
      }
      opts.doc = doc
      dao.emit('remove', opts, cb)
      next()
    })
  }

  var _done = function (opts, cb) { routes.done(opts, cb) }

  var _before_list = function (opts, cb, next) { routes.before_list(opts, cb, next) }
  var _after_list = function (opts, cb, next) { routes.after_list(opts, cb, next) }
  var _list = function (opts, cb, next) { routes.list(opts, cb, next) }

  var _before_get = function (opts, cb, next) { routes.before_get(opts, cb, next) }
  var _after_get = function (opts, cb, next) { routes.after_get(opts, cb, next) }
  var _get = function (opts, cb, next) { routes.get(opts, cb, next) }

  var _before_create = function (opts, cb, next) { routes.before_create(opts, cb, next) }
  var _after_create = function (opts, cb, next) { routes.after_create(opts, cb, next) }
  var _create = function (opts, cb, next) { routes.create(opts, cb, next) }

  var _before_update = function (opts, cb, next) { routes.before_update(opts, cb, next) }
  var _after_update = function (opts, cb, next) { routes.after_update(opts, cb, next) }
  var _update = function (opts, cb, next) { routes.update(opts, cb, next) }

  var _before_remove = function (opts, cb, next) { routes.before_remove(opts, cb, next) }
  var _after_remove = function (opts, cb, next) { routes.after_remove(opts, cb, next) }
  var _remove = function (opts, cb, next) { routes.remove(opts, cb, next) }

  router.use(function (opts, cb, next) {
    opts || (opts = {})
    opts.data || (opts.data = {})
    next()
  })

  if (opts.enable_router_save) {
    var _before_save = function (opts, cb, next) {
      var data = opts.data
      if (data._id) {
        opts.params.id = data._id
        delete data['_id']
        routes.before_update(opts, cb, next)
      } else {
        routes.before_create(opts, cb, next)
      }
    }
    var _after_save = function (opts, cb, next) {
      if (opts.params.id) {
        routes.after_update(opts, cb, next)
      } else {
        routes.after_create(opts, cb, next)
      }
    }
    var _save = function (opts, cb, next) {
      if (opts.params.id) {
        routes.update(opts, cb, next)
      } else {
        routes.create(opts, cb, next)
      }
    }
    router.post('/save', _before_save, _save, _after_save, _done)
  }

  router.add('/', 'get', _before_list, _list, _after_list, _done)
  router.add('/', 'put', _before_create, _create, _after_create, _done)
  router.add('/', 'post', _before_create, _create, _after_create, _done)
  router.add('/', 'delete', _before_remove, _remove, _after_remove, _done)

  router.add('/:id', 'get', _before_get, _get, _after_get, _done)
  router.add('/:id', 'post', _before_update, _update, _after_update, _done)
  router.add('/:id', 'delete', _before_remove, _remove, _after_remove, _done)

  return router
}
