'use strict';

module.exports = async function (req, res, next) {
  const bitcoin = this.bitcoin || this.regtest;
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      if (!req.params.txhash) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Transaction hash is required.' 
        });
      }

      try {
        // Get the current block height for confirmations calculation
        const currentHeight = await bitcoin._makeRPCRequest('getblockcount', []);

        // First try to get the transaction directly with verbose=true
        const tx = await bitcoin._makeRPCRequest('getrawtransaction', [req.params.txhash, true]);

        // If we have the transaction and it's confirmed, get its block for additional details
        if (tx.blockhash) {
          try {
            const block = await bitcoin._makeRPCRequest('getblock', [tx.blockhash]);
            tx.height = block.height;
            tx.confirmations = currentHeight - block.height + 1;
          } catch (blockError) {
            console.error('Failed to fetch block details:', blockError);
          }
        } else {
          // Transaction is in mempool
          tx.confirmations = 0;
          tx.height = null;
        }

        return res.json(tx);
      } catch (error) {
        // If the error is about missing transaction index
        if (error.code === -5 && error.message.includes('Use -txindex')) {
          // Try to get the transaction with block hash if provided
          if (req.query.blockhash) {
            try {
              const tx = await bitcoin._makeRPCRequest('getrawtransaction', [
                req.params.txhash,
                true, // Set verbose=true
                req.query.blockhash
              ]);

              // Get block details for height and confirmations
              try {
                const block = await bitcoin._makeRPCRequest('getblock', [tx.blockhash]);
                const currentHeight = await bitcoin._makeRPCRequest('getblockcount', []);
                tx.height = block.height;
                tx.confirmations = currentHeight - block.height + 1;
              } catch (blockError) {
                console.error('Failed to fetch block details:', blockError);
              }

              return res.json(tx);
            } catch (blockError) {
              return res.status(404).json({
                status: 'error',
                message: 'Transaction not found in the specified block.',
                details: blockError.message
              });
            }
          }

          return res.status(404).json({
            status: 'error',
            message: 'Transaction not found in mempool. The node is in pruned mode.',
            details: error.message,
            suggestion: 'Provide a block hash in the query parameter to search in a specific block.'
          });
        }

        // Handle other types of errors
        return res.status(500).json({
          status: 'error',
          message: 'Failed to fetch transaction',
          details: error.message
        });
      }
    }
  });
};
