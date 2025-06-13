'use strict';

// Web Crypto API shim for Node.js crypto module
const crypto = {
  createHash: function (algorithm) {
    // Map Node.js algorithm names to Web Crypto API algorithm names
    const algorithmMap = {
      'sha256': 'SHA-256',
      'sha384': 'SHA-384',
      'sha512': 'SHA-512',
      'sha1': 'SHA-1'
    };

    const webCryptoAlgorithm = algorithmMap[algorithm.toLowerCase()];
    if (!webCryptoAlgorithm) {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    let data = new Uint8Array(0);

    return {
      update: function (input) {
        if (typeof input === 'string') {
          const encoder = new TextEncoder();
          const newData = encoder.encode(input);
          const combined = new Uint8Array(data.length + newData.length);
          combined.set(data);
          combined.set(newData, data.length);
          data = combined;
        } else if (Buffer.isBuffer(input)) {
          const newData = new Uint8Array(input);
          const combined = new Uint8Array(data.length + newData.length);
          combined.set(data);
          combined.set(newData, data.length);
          data = combined;
        } else {
          throw new Error('Unsupported input type');
        }
        return this;
      },
      digest: function (encoding) {
        const hash = window.crypto.subtle.digestSync(webCryptoAlgorithm, data);
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return encoding === 'hex' ? hashHex : Buffer.from(hashArray);
      }
    };
  },
  randomBytes: function (size) {
    const array = new Uint8Array(size);
    window.crypto.getRandomValues(array);
    return Buffer.from(array);
  }
};

// Add synchronous digest method to SubtleCrypto
window.crypto.subtle.digestSync = function (algorithm, data) {
  const hash = new Uint8Array(32); // Default size for SHA-256
  window.crypto.subtle.digest(algorithm, data).then(result => {
    const hashArray = new Uint8Array(result);
    hash.set(hashArray);
  });
  return hash;
};

module.exports = crypto; 