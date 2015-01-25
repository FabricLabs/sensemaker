'use strict';

var util = require('util');
//var Datastore = require('./lib/datastore');
// tempoerary, until rethink is fixed
var Datastore = require('./lib/datastore/mongo');

function Sensemaker(config) {
  var self = this;

  if (!config) config = {};
  self.config = config;
  
  self.sources = {};  
  self.Source = require('./lib/source');
  self.version = require('./package').version;
  
  self.datastore = new Datastore( config.namespace || 'sensemaker' );

  /* self.datastore = new Datastore( config.namespace || 'sensemaker' );
  self.defineModel = self.datastore.reheat.defineModel;

  self.Item = self.defineModel('Item', {
    tableName: 'item',
    connection: self.datastore.connection
  }); */

};
util.inherits( Sensemaker , require('events').EventEmitter );

Sensemaker.prototype.enable = function( name , config ) {
  var Service = require('./lib/sources/' + name );
  this.sources[ name ] = new Service( config );
  this.emit('service', this.sources[ name ] );
};

Sensemaker.prototype.ingest = function(object, callback) {
  var self = this;
  
  var pipeline = [];

  async.waterfall([
    storeDatum,
    storeObject
  ], function(err, results) {
    if (err) return callback(err);
    
    console.log('results:', results);
    return callback( err , results[1] );
    
  });

  function storeDatum(done) {
    console.log('store datum....')
    var datum = new self.Data( object.data );
    datum.save(function(err) {
      if (!err) delete object.data;
      
      console.log('datum done, ', datum);
      return done( err , datum );
    });
  }

  function storeObject(datum, done) {
    console.log('storing object,')
    var item = new self.Item( object );
    item._datum = datum._id;
    item.save( done );
  };

  
  /*var reheat = require('reheat');
  var connection = new reheat.Connection();
  
  var Item = reheat.defineModel('Item', {
    tableName: 'item',
    connection: connection
  });
  
  
  var item = new Item( object );
  item.save().then( callback ); */
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

Sensemaker.prototype.start = function(cb) {
  if (!cb) var cb = new Function();
  
  var self = this;
  
  self.datastore.on('error', function(err) {
    console.log('datastore err', err );
  });
  
  self.datastore.on('open', function(err) {
    console.log('datastore opened.');
  });
  
  self.datastore.connect(function() {
    var mongoose = self.datastore.mongoose;
    var ItemSchema = new mongoose.Schema({
      //_actor: { type: String , ref: 'Item' },
      type: { type: String },
      source: { type: String , enum: Object.keys( self.sources ) },
      id: { type: String },
      geo: {},
      _datum: {},
    });
    
    ItemSchema.index({ 'geo.coordinates': '2dsphere' });
    ItemSchema.index({ source: 1 , id: 1 });
    
    var DataSchema = new mongoose.Schema({
      data: {},
    }, {
      collection: 'datum'
    });

    self.Item = self.datastore.connection.model('Item', ItemSchema );
    self.Data = self.datastore.connection.model('Data', DataSchema );
    return cb();
  });
  
};

module.exports = Sensemaker;
