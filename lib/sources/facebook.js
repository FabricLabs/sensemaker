'use strict';

var util = require('util');
var Source = require('../source');
var rest = require('restler');
var querystring = require('querystring');

function Facebook( options ) {
  this.config = options;
}

util.inherits( Facebook , Source );

Facebook.prototype.get = function(path, opts, done) {
  if (typeof opts === 'function') {
    done = opts;
    opts = {};
  }
  var self = this;

  opts.access_token = self.config.appID +'|'+ self.config.appSecret; //'app_id|app_secret'
  var remoteURL = self.config.baseURI + path + '?' + querystring.stringify(opts);

  if (!opts.results) {
    opts.results = [];
  }

  rest.get( remoteURL ).on('complete', function(data) {
    if (opts.all !== true) {
      return done(null, data);
    }

    if (data.data && data.data.length) {
      data.data.forEach(function(item) {
        opts.results.push( item ) 
      });
    }

    if (data.paging && data.paging.next) {
      self.get( data.paging.next , opts , done )
    } else {
      return done(null, { data: opts.results }); // emulates wrapped 'data'
    }

  });
}

Facebook.prototype._getLikeCount = function( uri , done ) {
  this.get('v2.2/', {
    id: uri,
    fields: 'og_object{engagement}'
  }, function(err, results) {
    if (!results.og_object) return done(err);
    done( err , results.og_object.engagement.count );
  });
}

Facebook.prototype._getShareCount = function( uri , done ) {
  this.get('', {
    id: uri
  }, function(err, obj) {
    done( err , obj.shares );
  });
}

module.exports = Facebook;
