'use strict';

var util = require('util');
var async = require('async');

function Source(options) {
  if (!(this instanceof Source)) {
    return new Source(options);
  }
};

util.inherits( Source , require('events').EventEmitter );

Source.prototype.getActor = function(query, callback) {
  
};

Source.prototype.getActorStream = function(query, callback) {
  
};

Source.prototype.getObject = function(query, callback) {
  
};

Source.prototype.getObjectStream = function(query, callback) {
  
};

Source.prototype.normalize = function(object, callback) {
  if (!object.actor) callback('actor required');
  return callback( null , object );
};

module.exports = Source;
