'use strict';

var Datastore = require('./');
var mongoose = require('mongoose');
var util = require('util');

function MongooseStore(namespace) {
  this.namespace = namespace;
  this.mongoose = mongoose;
}

util.inherits( MongooseStore , Datastore );

MongooseStore.prototype.connect = function(cb) {
  if (!cb) var cb = new Function();  

  var self = this;

  self.connection = self.mongoose.createConnection('mongodb://localhost/' + self.namespace );
  self.connection.on('error', function(err) {
    self.emit('error', err );
  });
  self.connection.once('open', function() {
    self.emit('open');
    return cb();
  });
};

module.exports = MongooseStore;
