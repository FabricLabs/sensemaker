var assert = require('assert');
var Sensemaker = require('..');

describe('Sensemaker', function() {
  it('should be instantiable', function() {
    assert.equal( typeof Sensemaker , 'function' );
  });
  
  it('should have a correct version attribute', function() {
    var sensemaker = new Sensemaker();
    assert.equal( require('../package').version , sensemaker.version );
  });
  
  it('should implement enable', function() {
    assert.ok( Sensemaker.prototype.enable );
  });
  
  it('should implement ingest', function() {
    assert.ok( Sensemaker.prototype.ingest );
  });
  
});
