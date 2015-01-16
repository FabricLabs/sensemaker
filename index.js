'use strict';

var util = require('util');
var Datastore = require('./lib/datastore');

function Sensemaker(config) {
  var self = this;

  if (!config) config = {};
  self.config = config;
  
  self.sources = {};  
  self.Source = require('./lib/source');
  self.version = require('./package').version;

  self.datastore = new Datastore( config.namespace || 'sensemaker' );
  self.defineModel = self.datastore.reheat.defineModel;

  self.Item = self.defineModel('Item', {
    tableName: 'item',
    connection: self.datastore.connection
  });

};
util.inherits( Sensemaker , require('events').EventEmitter );

Sensemaker.prototype.enable = function( name , config ) {
  var Service = require('./lib/sources/' + name );
  this.sources[ name ] = new Service( config );
  this.emit('service', this.sources[ name ] );
};

Sensemaker.prototype.ingest = function(object, callback) {
  var self = this;
  self.normalize( object , function(err, normalized) {
    console.log('normalized:', normalized);
    var item = new self.Item( normalized );
    item.save().then( callback );
  });
};

Sensemaker.prototype.documentStats = function(uri, callback) {
  var sensemaker = this;

  // TODO: job system
  async.parallel({
    facebookShares:          getFacebookShares( uri ),
    facebookLikes:           getFacebookLikes( uri ),
    tweetCount:              getTweetCount( uri ),
    plusCount:               getPlusCount( uri ),
  }, callback );
  
  function getFacebookShares(uri) {
    return function(done) {
      sensemaker.sources['facebook']._getShareCount( uri , done );
    };
  }

  function getFacebookLikes(uri) {
    return function(done) {
      sensemaker.sources['facebook']._getLikeCount( uri , done );
    };
  }
  
  function getTweetCount(uri) {
    return function(done) {
      sensemaker.sources['twitter']._getTweetCount( uri , done );
    };
  }
  
  function getPlusCount(uri) {
    return function(done) {
      sensemaker.sources['google']._getPlusCount( uri , done );
    };
  }

};

module.exports = Sensemaker;
