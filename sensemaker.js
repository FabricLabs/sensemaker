'use strict';

const config = require('./config');

const Fabric = require('fabric');
const Sensemaker = require('./lib/sensemaker');

async function main () {
  let fabric = new Fabric(config);
  let sensemaker = new Sensemaker(config);
  
  console.log('fabric:', fabric);
  console.log('sensemaker:', sensemaker);
}

main();
