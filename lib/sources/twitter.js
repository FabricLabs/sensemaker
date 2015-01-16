'use strict';

var util = require('util');
var Source = require('../source');
var mtwitter = require('mtwitter');
var bigint = require('bigint');
var rest = require('restler');

function Twitter(options) {
  this.config = options;
  
  this._twitter = new mtwitter({
      consumer_key:        options.consumerKey
    , consumer_secret:     options.consumerSecret
    , access_token_key:    options.accessTokenKey
    , access_token_secret: options.accessTokenSecret
  });

}

util.inherits( Twitter , Source );

Twitter.prototype.get = function( path , opts , done ) {
  this._twitter.get( path , opts , done );
};

Twitter.prototype.getActor = function( id , callback ) {
  this.get('users/show', {
    screen_name: id
  }, callback );
};

Twitter.prototype.getActorStream = function( id , opts , callback ) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  
  opts.screen_name = id;
  
  this._getTimeline( 'user_timeline' , opts , callback );
};

Twitter.prototype._getTweetCount = function(url, done) {
  rest.get('https://cdn.api.twitter.com/1/urls/count.json?url=' + url).on('complete', function(stats) {
    done( null , stats.count );
  });
};

Twitter.prototype._getTimeline = function(type, opts, done) {
  if (typeof(opts) == 'function') {
    done = opts;
    opts = {};
  }

  var self = this;

  var twitterOpts = {
      screen_name: opts.screen_name
    , exclude_replies: true
    , include_rts: false
    , count: 200
  };
  if (opts.oldestID) twitterOpts.max_id = opts.oldestID.toString();

  self.get('statuses/' + type , twitterOpts , function(err, tweets) {
    if (err) return done(err);
    if (opts.all !== true) return done(err, tweets);

    if (!opts.results) opts.results = [];
    if (!tweets.length) return done(err, opts.results);

    var originalLength = opts.results.length;
    tweets.forEach(function(tweet) {
      if (opts.results.map(function(x) { return x.id_str; }).indexOf( tweet.id_str ) == -1) {
        opts.results.push( tweet );
      }

      if (!opts.oldestID || opts.oldestID.gt( bigint( tweet.id_str ) ) ) {
        opts.oldestID = bigint( tweet.id_str );
      }
    });

    if (originalLength == opts.results.length) {
      return done(err, opts.results);
    }

    return self._getTimeline('user_timeline', opts , done );

  });
};

module.exports = Twitter;
