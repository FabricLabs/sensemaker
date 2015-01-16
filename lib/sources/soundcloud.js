'use strict';

var util = require('util');
var Source = require('../source');
var rest = require('restler');
var querystring = require('querystring');

function Soundcloud( config ) {
  this.config = config;
  this.baseURI = 'https://api.soundcloud.com/';
}

util.inherits( Soundcloud , Source );

Soundcloud.prototype.get = function(path, opts, done) {
  if (typeof opts === 'function') {
    done = opts;
    opts = {};
  }
  var self = this;

  opts.client_id = self.config.clientID;
  var remoteURL = self.baseURI + path + '.json?' + querystring.stringify(opts);

  rest.get( remoteURL , {
    headers: {
      'Accept': 'application/json'
    }
  }).on('complete', function(data) {
    return done( null , data );
  });
};

Soundcloud.prototype._getPlayCount = function( id , done ) {
  var self = this;
  self.get('tracks/' + id , function(err, track) {
    done( err , track.playback_count );
  });
}

module.exports = Soundcloud;
