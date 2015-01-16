var assert = require('assert');
var Source = require('../lib/source');

describe('Source', function() {
  it('should be instantiable', function() {
    assert.equal( typeof Source , 'function' );
  });

  it('should implement getActor', function() {
    assert.ok( Source.prototype.getActor );
  });

  it('should implement getActorStream', function() {
    assert.ok( Source.prototype.getActorStream );
  });

  it('should implement getObject', function() {
    assert.ok( Source.prototype.getObject );
  });

  it('should implement getObjectStream', function() {
    assert.ok( Source.prototype.getObjectStream );
  });

  it('should implement normalize', function() {
    assert.ok( Source.prototype.normalize );
  });

});
