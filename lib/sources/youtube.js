'use strict';

var util = require('util');
var Source = require('../source');
var rest = require('restler');
var querystring = require('querystring');

function YouTube( config ) {
  this.config = config;
  this.baseURI = 'https://www.googleapis.com/youtube/v3/';
}

util.inherits( YouTube , Source );

YouTube.prototype.get = function( path , opts , done ) {
  if (typeof opts === 'function') {
    done = opts;
    opts = {};
  }
  var self = this;
  
  opts.key = self.config.key;

  var remoteURL = self.baseURI + path + '?' + querystring.stringify(opts);

  rest.get( remoteURL ).on('complete', function(list) {
    done( null , list );
  });
  
};

YouTube.prototype._getViewCount = function( id , done ) {
  var self = this;
  self.get('videos', {
    id: id,
    part: 'statistics'
  }, function(err, list) {
    if (!list.items || !list.items.length) return done(err);
    done( err , list.items[0].statistics.viewCount );
  });
};

module.exports = YouTube;
