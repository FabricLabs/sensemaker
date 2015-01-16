'use strict';

var util = require('util');
var Source = require('../source');
var rest = require('restler');
var querystring = require('querystring');

function Google( config ) {
  this.config = config;
  this.baseURI = 'https://content.googleapis.com/plus/v1/';

}

util.inherits( Google , Source );

Google.prototype.get = function( path , opts , done ) {
  if (typeof opts === 'function') {
    done = opts;
    opts = {};
  }
  var self = this;
  
  opts.key = self.config.key;

  var remoteURL = self.baseURI + path + '?' + querystring.stringify(opts);
  
  rest.get( remoteURL ).on('complete', function(data) {
    done( null , data );
  });

};

Google.prototype._getPlusCount = function( url , done ) {
  var self = this;
  self.get('activities', {
    query: url
  }, function(err, feed) {
    var count = feed.items.reduce(function(prev, item) {
      return prev + item.object.plusoners.totalItems;
    }, 0);
    done( err , count );
  });
};

module.exports = Google;
