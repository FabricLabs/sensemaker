'use strict';

const crypto = require('crypto');

const content = 'Hello, world!';
const preimage = crypto.createHash('sha256').update(content).digest('hex');
const hash = crypto.createHash('sha256').update(preimage).digest('hex');

const preimageBuffer = crypto.createHash('sha256').update(content).digest();
const hashBuffer = crypto.createHash('sha256').update(preimageBuffer).digest('hex');

console.log('Content:', content);
console.log('Preimage Hash:', preimage);
console.log('Final Hash:', hash);

console.log('Preimage Buffer:', preimageBuffer.toString('hex'));
console.log('Final Hash Buffer:', hashBuffer.toString('hex'));
