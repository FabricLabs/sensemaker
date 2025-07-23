'use strict';

module.exports = async function (req, res, next) {
  const bitcoin = this.bitcoin || this.regtest;
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      if (!req.params.blockhash) {
        return res.send({ status: 'error', message: 'Block hash is required.' });
      }
      try {
        const block = await bitcoin._makeRPCRequest('getblock', [req.params.blockhash]);
        res.send(block);
      } catch (error) {
        res.status(500).send({ status: 'error', message: error.message });
      }
    }
  });
};
