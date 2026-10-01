'use strict';

const generateBitcoinStatus = async function (cacheKey, cacheTTL) {
  const bitcoin = this.bitcoin || this.regtest;
  // Make RPC calls with original names
  const blockchain = await bitcoin._makeRPCRequest('getblockchaininfo', []);
  console.debug('got blockchain info:', blockchain)

  const best = await bitcoin._makeRPCRequest('getbestblockhash', []);
  console.debug('got best block hash:', best);

  const height = await bitcoin._makeRPCRequest('getblockcount', []);
  console.debug('got block count:', height);

  // Initialize mempool info with default values
  let mempoolinfo = {
    size: 0,
    bytes: 0,
    usage: 0,
    maxmempool: 300000000, // 300MB default
    mempoolminfee: 0.00001000, // 1 sat/byte default
    minrelaytxfee: 0.00001000 // 1 sat/byte default
  };

  try {
    const result = await bitcoin._makeRPCRequest('getmempoolinfo', [true]);
    if (result) {
      mempoolinfo = {
        ...mempoolinfo, // Keep defaults as fallback
        ...result // Override with actual values if available
      };
    }
  } catch (err) {
    console.error('[SENSEMAKER]', 'Error getting mempool info:', err);
  }

  console.debug('got mempool info:', mempoolinfo);

  const tip = await bitcoin._makeRPCRequest('getblockheader', [best]);
  console.debug('got tip:', tip);

  // Initialize market with default values
  let market = {
    subsidy: 0,
    totalfee: 0,
    height: height,
    time: Date.now() / 1000
  };

  try {
    const result = await bitcoin._makeRPCRequest('getblockstats', [tip.height]);
    if (result) {
      market = {
        ...market, // Keep defaults as fallback
        ...result // Override with actual values if available
      };
    }
  } catch (err) {
    console.error('[SENSEMAKER]', 'Error getting block stats:', err);
  }

  console.debug('got block stats:', market);

  // Get block stats with error handling
  const blockstatsPromises = [
    height,
    height - 1,
    height - 2,
    height - 3,
    height - 4,
    height - 5
  ].map(h => bitcoin._makeRPCRequest('getblockstats', [h])
    .catch(err => {
      console.error('[SENSEMAKER]', `Error getting block stats for height ${h}:`, err);
      return null;
    }));

  const blockstats = await Promise.all(blockstatsPromises);
  console.debug('got all blockstats:', blockstats);

  // Filter out any failed block stats and ensure they have required properties
  const validBlockstats = blockstats.filter(x => x != null && x.blockhash && x.subsidy != null && x.totalfee != null);

  // Get blocks with error handling
  const blocks = await Promise.all(validBlockstats.map(async (x) => {
    try {
      const block = await bitcoin._makeRPCRequest('getblock', [x.blockhash, 2]);
      if (block) {
        block.subsidy = (x.subsidy || 0) / 100000000;
        block.feesPaid = (x.totalfee || 0) / 100000000;
        return block;
      }
      return null;
    } catch (err) {
      console.error('[SENSEMAKER]', `Error getting block ${x.blockhash}:`, err);
      return null;
    }
  }));

  // Filter out any failed blocks
  const validBlocks = blocks.filter(x => x != null);
  const transactions = [];

  // Get cached mempool data if available
  const cachedMempool = await this.cache.get('bitcoin:mempool');
  const mempooltxs = cachedMempool || {};

  // Process mempool transactions
  for (const [txid, tx] of Object.entries(mempooltxs)) {
    const mempoolTx = {
      txid: txid,
      time: tx.time,
      fee: tx.fee,
      size: tx.size,
      height: -1, // -1 indicates unconfirmed
      blockhash: null,
      value: tx.vout ? tx.vout.reduce((acc, x) => acc + x.value, 0) : 0
    };
    transactions.push(mempoolTx);
  }

  // Loop through all blocks until we have 5 transactions
  for (let i = 0; i < validBlocks.length; i++) {
    const block = validBlocks[i];
    // Calculate the total value of the block
    block.value = (block.tx) ? block.tx.reduce((acc, x) => acc + x.vout.reduce((acc, x) => acc + x.value, 0), 0) : 0;
    if (!block.tx) continue;

    // For all transactions in the block...
    for (let j = 0; j < block.tx.length; j++) {
      const tx = block.tx[j];

      // Assign properties
      tx.blockhash = block.hash;
      tx.height = block.height;
      tx.time = block.time;
      tx.value = tx.vout.reduce((acc, x) => acc + x.value, 0);

      // Add the transaction to the list
      transactions.push(tx);

      // Is this enough?
      if (transactions.length >= 5) break;
    }

    // Remove transaction data after we're done with it
    delete validBlocks[i].tx;

    // Do we have enough transactions?
    if (transactions.length >= 5) break;
  }

  // Sort transactions by time in descending order (most recent first)
  transactions.sort((a, b) => b.time - a.time);

  // Get cached UTXO set info if available
  const cachedUtxoSet = await this.cache.get('bitcoin:utxoset');
  const utxoutset = cachedUtxoSet || {
    total_amount: 0,
    transactions: 0,
    txouts: 0
  };

  const status = {
    network: bitcoin.network,
    genesisHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
    blockChain: blockchain,
    blockDate: tip.time,
    blockHeight: bitcoin.height,
    supply: utxoutset.total_amount,
    status: 'ONLINE', // TODO: check for syncing status
    tip: best,
    height: height,
    mempoolInfo: {
      size: mempoolinfo.size,
      bytes: mempoolinfo.bytes,
      usage: mempoolinfo.usage,
      maxmempool: mempoolinfo.maxmempool,
      mempoolminfee: mempoolinfo.mempoolminfee,
      minrelaytxfee: mempoolinfo.minrelaytxfee
    },
    mempoolSize: mempoolinfo.usage,
    unspentTransactions: utxoutset.transactions,
    unspentOutputs: utxoutset.txouts,
    market: {
      subsidy: market.subsidy / 100000000,
      feesPaid: market.totalfee / 100000000,
      height: market.height,
      time: market.time
    },
    recentBlocks: validBlocks.map(block => ({
      hash: block.hash,
      height: block.height,
      time: block.time,
      size: block.size,
      weight: block.weight,
      subsidy: block.subsidy,
      feesPaid: block.feesPaid,
      value: block.value
    })),
    recentTransactions: transactions.map(tx => ({
      txid: tx.txid,
      time: tx.time,
      fee: tx.fee,
      size: tx.size,
      height: tx.height,
      value: tx.value
    })),
    syncActive: blockchain.initialblockdownload,
    syncProgress: blockchain.verificationprogress,
    timestamp: Date.now() // Add timestamp for cache freshness check
  };

  // Store in state
  this._state.content.services.bitcoin.status = status;

  // Cache the status
  await this.cache.set(cacheKey, status, cacheTTL);

  // Update UTXO set info in the background
  bitcoin._makeRPCRequest('gettxoutsetinfo', []).then(async (utxoSet) => {
    // Cache the UTXO set info for 1 hour
    await this.cache.set('bitcoin:utxoset', utxoSet, 3600000);
    // Update the cache with fresh data
    await this.cache.set(cacheKey, status, cacheTTL);

    // Update the state with fresh UTXO data
    if (this._state.content.services.bitcoin.status) {
      this._state.content.services.bitcoin.status.supply = utxoSet.total_amount;
      this._state.content.services.bitcoin.status.unspentTransactions = utxoSet.transactions;
      this._state.content.services.bitcoin.status.unspentOutputs = utxoSet.txouts;
    }
  }).catch(err => {
    console.error('[SENSEMAKER]', 'Failed to update UTXO set info:', err);
  });

  // Update mempool data in the background
  bitcoin._makeRPCRequest('getrawmempool', [true]).then(async (mempoolData) => {
    // Cache the mempool data for 30 seconds
    await this.cache.set('bitcoin:mempool', mempoolData, 30000);
    this._state.content.services.bitcoin.mempool = mempoolData;
  }).catch(err => {
    console.error('[SENSEMAKER]', 'Failed to update mempool data:', err);
  });

  return status;
};

module.exports = generateBitcoinStatus;
