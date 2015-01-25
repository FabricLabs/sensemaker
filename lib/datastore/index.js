'use strict';

var util = require('util');
var reheat = require('reheat');

function Datastore(namespace) {

}

util.inherits( Datastore , require('events').EventEmitter );

Datastore.prototype.connect = function(cb) {
  if (!cb) var cb = new Function();
  return cb();
}

module.exports = Datastore;
