var Promise = require('bluebird');
require('jm-ms-core');
require('jm-logger');
require('../lib');
var ms = jm.ms;
var logger = jm.logger;
var utils = jm.utils;
var model = require('./model');
var app = ms();
var router = ms.daorouter(model, {
    list: {
        fields: {
            title: 1
        },
    },
    get: {
        fields: {
            title: 1,
            tags: 1
        },
    }
});
app.use(router);

var log = function (err, doc) {
    if (err) {
        logger.error(err.stack);
    }
    if (doc) {
        logger.debug('%s', utils.formatJSON(doc));
    }
};

var done = function (resolve, reject, err, doc) {
    log(err, doc);
    if (err) {
        reject(err, doc);
    } else {
        resolve(doc);
    }
};

var id = null;
var add = function (opts) {
    return new Promise(function (resolve, reject) {
        logger.debug('add');
        app.post(
            '/',
            {
                title: 'productTitle',
                tags: ['product', 'new', 'test']
            },
            function (err, doc) {
                if (!err) id = doc.id;
                done(resolve, reject, err, doc);
            }
        );
    });
};

var list = function (opts) {
    return new Promise(function (resolve, reject) {
        logger.debug('list');
        app.get(
            '/',
            {
                page: 1,
                rows: 10
            },
            function (err, doc) {
                done(resolve, reject, err, doc);
            }
        );
    });
};

var get = function (opts) {
    return new Promise(function (resolve, reject) {
        logger.debug('get');
        app.get(
            '/' + id,
            function (err, doc) {
                done(resolve, reject, err, doc);
            }
        );
    });
};

var update = function (opts) {
    return new Promise(function (resolve, reject) {
        logger.debug('update');
        app.post(
            '/' + id,
            {
                title: 'productTitle2',
                tags: ['product']
            },
            function (err, doc) {
                done(resolve, reject, err, doc);
            }
        );
    });
};

var del = function (opts) {
    return new Promise(function (resolve, reject) {
        logger.debug('delete');
        app.delete(
            '/' + id,
            function (err, doc) {
                done(resolve, reject, err, doc);
            }
        );
    });
};


add()
    .then(function (doc) {
        return list();
    })
    .then(function (doc) {
        return get();
    })
    .then(function (doc) {
        return update();
    })
    .then(function (doc) {
        return get();
    })
    .then(function (doc) {
        return del();
    })
    .then(function (doc) {
        return list();
    })
    .catch(SyntaxError, function (e) {
        logger.error(e.stack);
    })
    .catch(function (e) {
        logger.error(e.stack);
    });
