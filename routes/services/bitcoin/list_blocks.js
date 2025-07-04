'use strict';

module.exports = async function (req, res, next) {
  const bitcoin = this.bitcoin || this.regtest;

  // Add timeout wrapper function
  const withTimeout = (promise, timeoutMs = 30000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
      )
    ]);
  };

  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      // TODO: allow various parameters (sort order, cursor start, etc.)
      // TODO: cache each of these queries
      // TODO: cache this request overall
      if (!bitcoin) {
        return res.status(503).json({
          error: 'Bitcoin service is not available',
          status: 'error',
          message: 'The Bitcoin service has not been initialized'
        });
      }

      try {
        const height = await withTimeout(bitcoin._makeRPCRequest('getblockcount', []));
        const promises = [];
        const count = 10;

        for (let i = 0; i < count; i++) {
          promises.push(withTimeout(bitcoin._makeRPCRequest('getblockstats', [height - i])));
        }

        const blockstats = await Promise.all(promises);
        const blocks = await Promise.all(blockstats.map(async (x) => {
          return new Promise((resolve, reject) => {
            withTimeout(bitcoin._makeRPCRequest('getblock', [x.blockhash, 1]))
              .then((block) => {
                block.subsidy = x.subsidy / 100000000;
                block.feesPaid = x.totalfee /  100000000;
                // TODO: evaluate TX inclusion
                block.tx = null;
                resolve(block);
              })
              .catch((error) => {
                reject(error);
              });
          });
        }));

        // TODO: read transactions from recent blocks
        const transactions = [];

        // Loop through all blocks until we have 5 transactions
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          // Calculate the total value of the block
          // block.value = (block.tx) ? block.tx.reduce((acc, x) => acc + x.vout.reduce((acc, x) => acc + x.value, 0), 0) : 0;
          block.value = 0;
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
          }
        }

        return res.send(blocks);
      } catch (error) {
        return res.status(504).json({
          error: 'Request timeout',
          status: 'error',
          message: error.message || 'The request took too long to complete'
        });
      }
    }
  });
};
