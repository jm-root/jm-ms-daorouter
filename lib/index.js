var daorouter = require('./router')

if (typeof global !== 'undefined' && global) {
  !global.jm && (global.jm = {})
  var jm = global.jm
  if (jm.ms) {
    jm.ms.daorouter = daorouter
  }
}

module.exports = daorouter
