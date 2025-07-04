'use strict';

module.exports = async function (req, res, next) {
  const bitcoin = this.bitcoin || this.regtest;

  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      try {
        // Get current height first
        const height = await bitcoin._makeRPCRequest('getblockcount', []);
        
        // Get mempool transactions (limited to 20 most recent)
        const mempool = await bitcoin._makeRPCRequest('getrawmempool', [true]); // Get verbose mempool
        const mempoolTxids = Object.keys(mempool)
          .sort((a, b) => mempool[b].time - mempool[a].time) // Sort by time
          .slice(0, 20); // Take only 20 most recent

        // Fetch mempool transactions with timeout
        const mempoolTransactions = await Promise.all(
          mempoolTxids.map(async (txid) => {
            try {
              const tx = await Promise.race([
                bitcoin._makeRPCRequest('getrawtransaction', [txid, 1]),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout')), 5000)
                )
              ]);
              
              return {
                ...tx,
                confirmations: 0,
                blockhash: null,
                height: null,
                time: mempool[txid].time,
                value: tx.vout.reduce((acc, x) => acc + (x.value || 0), 0)
              };
            } catch (error) {
              console.error(`Failed to fetch mempool tx ${txid}:`, error.message);
              return null;
            }
          })
        );

        // Get recent blocks (limited to 5 for performance)
        const count = 5;
        const blockPromises = [];

        for (let i = 0; i < count; i++) {
          blockPromises.push(bitcoin._makeRPCRequest('getblockstats', [height - i]));
        }

        const blockstats = await Promise.all(blockPromises);
        
        // Fetch block details with timeout
        const blocks = await Promise.all(
          blockstats.map(async (x) => {
            try {
              const block = await Promise.race([
                bitcoin._makeRPCRequest('getblock', [x.blockhash, 1]),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout')), 5000)
                )
              ]);

              // Fetch full transaction details for each transaction in the block
              const txPromises = (block.tx || []).map(async (txid) => {
                try {
                  const tx = await Promise.race([
                    bitcoin._makeRPCRequest('getrawtransaction', [txid, 1]),
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Timeout')), 5000)
                    )
                  ]);

                  return {
                    ...tx,
                    confirmations: height - block.height + 1,
                    blockhash: block.hash,
                    height: block.height,
                    time: block.time,
                    value: tx.vout.reduce((acc, x) => acc + (x.value || 0), 0)
                  };
                } catch (error) {
                  console.error(`Failed to fetch transaction ${txid} in block ${block.hash}:`, error.message);
                  return null;
                }
              });

              const transactions = await Promise.all(txPromises);

              return {
                ...block,
                subsidy: x.subsidy / 100000000,
                feesPaid: x.totalfee / 100000000,
                tx: transactions.filter(Boolean) // Remove failed transaction fetches
              };
            } catch (error) {
              console.error(`Failed to fetch block ${x.blockhash}:`, error.message);
              return { tx: [] };
            }
          })
        );

        // Combine and filter transactions
        const transactions = [
          ...mempoolTransactions.filter(Boolean), // Remove null transactions
          ...blocks
            .filter(x => x.tx && x.tx.length)
            .map(x => x.tx)
            .flat()
        ];

        return res.send(transactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch transactions',
          message: error.message 
        });
      }
    }
  });
}
