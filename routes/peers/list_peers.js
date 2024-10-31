'use strict';

module.exports = async function (req, res, next) {
  // const peers = await this.fabric.peers.list();
  const peers = [];
  res.json(peers);
};
