// scripts/vanity.js

const bitcoin = require('bitcoinjs-lib');
const randomBytes = require('randombytes');

const desiredString = '1Love'; // put your desired vanity address prefix here

async function generateVanityAddress() {
  let address = '';

  while (!address.startsWith(desiredString)) {
    const keypair = bitcoin.ECPair.makeRandom({ rng: randomBytes });
    const { address } = bitcoin.payments.p2pkh({ pubkey: keypair.publicKey });
    
    if (address.startsWith(desiredString)) {
      return { address, privateKey: keypair.toWIF() };
    }
  }
}

generateVanityAddress().then(({ address, privateKey }) => {
  console.log('Vanity address found: ', address);
  console.log('Private key: ', privateKey);
}).catch((err) => {
  console.error(err);
});
