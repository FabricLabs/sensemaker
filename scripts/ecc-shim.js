'use strict';

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const ecc = {
  isPoint: function (p) {
    try {
      return p instanceof Uint8Array && p.length === 33;
    } catch (e) {
      return false;
    }
  },
  isPrivate: function (d) {
    try {
      if (!(d instanceof Uint8Array) || d.length !== 32) return false;
      const key = ec.keyFromPrivate(d);
      const n = ec.curve.n;
      const dBN = key.getPrivate();
      return !dBN.isZero() && dBN.cmp(n) < 0;
    } catch (e) {
      return false;
    }
  },
  pointFromScalar: function (d) {
    if (!this.isPrivate(d)) throw new Error('Expected private key');
    const key = ec.keyFromPrivate(d);
    return new Uint8Array(key.getPublic().encodeCompressed());
  },
  pointMultiply: function (p, tweak) {
    if (!this.isPoint(p)) throw new Error('Expected point');
    if (!(tweak instanceof Uint8Array) || tweak.length !== 32) {
      throw new Error('Expected tweak');
    }
    const point = ec.keyFromPublic(p).getPublic();
    const result = point.mul(tweak);
    return new Uint8Array(result.encodeCompressed());
  },
  pointAdd: function (p, tweak) {
    if (!this.isPoint(p)) throw new Error('Expected point');
    if (!(tweak instanceof Uint8Array) || tweak.length !== 32) {
      throw new Error('Expected tweak');
    }
    const point = ec.keyFromPublic(p).getPublic();
    const tweakPoint = ec.keyFromPrivate(tweak).getPublic();
    const result = point.add(tweakPoint);
    return new Uint8Array(result.encodeCompressed());
  },
  privateAdd: function (d, tweak) {
    if (!this.isPrivate(d)) throw new Error('Expected private key');
    if (!(tweak instanceof Uint8Array) || tweak.length !== 32) {
      throw new Error('Expected tweak');
    }
    const key = ec.keyFromPrivate(d);
    const tweakBN = ec.keyFromPrivate(tweak).getPrivate();
    const result = key.getPrivate().add(tweakBN).mod(ec.curve.n);
    return new Uint8Array(result.toArray('be', 32));
  },
  privateNegate: function (d) {
    if (!this.isPrivate(d)) throw new Error('Expected private key');
    const key = ec.keyFromPrivate(d);
    const result = key.getPrivate().neg().mod(ec.curve.n);
    return new Uint8Array(result.toArray('be', 32));
  },
  sign: function (hash, privateKey) {
    if (!(hash instanceof Uint8Array) || hash.length !== 32) {
      throw new Error('Expected hash');
    }
    if (!this.isPrivate(privateKey)) throw new Error('Expected private key');
    const key = ec.keyFromPrivate(privateKey);
    const sig = key.sign(hash, { canonical: true });
    const r = sig.r.toArray('be', 32);
    const s = sig.s.toArray('be', 32);
    return new Uint8Array([...r, ...s]);
  },
  verify: function (hash, publicKey, signature) {
    if (!(hash instanceof Uint8Array) || hash.length !== 32) {
      throw new Error('Expected hash');
    }
    if (!this.isPoint(publicKey)) throw new Error('Expected public key');
    if (!(signature instanceof Uint8Array) || signature.length !== 64) {
      throw new Error('Expected signature');
    }
    const key = ec.keyFromPublic(publicKey);
    const r = signature.slice(0, 32);
    const s = signature.slice(32);
    return key.verify(hash, { r, s });
  },
  xOnlyPointAddTweak: function (point, tweak) {
    if (!this.isPoint(point)) throw new Error('Expected point');
    if (!(tweak instanceof Uint8Array) || tweak.length !== 32) {
      throw new Error('Expected tweak');
    }
    try {
      const pubKey = ec.keyFromPublic(point).getPublic();
      const tweakPoint = ec.keyFromPrivate(tweak).getPublic();
      const result = pubKey.add(tweakPoint);
      const xOnly = result.encodeCompressed().slice(1);
      return {
        xOnlyPubkey: new Uint8Array(xOnly),
        parity: result.getY().isEven() ? 0 : 1
      };
    } catch (e) {
      return null;
    }
  },
  pointAddScalar: function (point, scalar) {
    if (!this.isPoint(point)) throw new Error('Expected point');
    if (!(scalar instanceof Uint8Array) || scalar.length !== 32) {
      throw new Error('Expected scalar');
    }
    const pubKey = ec.keyFromPublic(point).getPublic();
    const scalarPoint = ec.keyFromPrivate(scalar).getPublic();
    const result = pubKey.add(scalarPoint);
    return new Uint8Array(result.encodeCompressed());
  }
};

module.exports = ecc; 