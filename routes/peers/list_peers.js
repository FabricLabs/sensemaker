'use strict';

module.exports = async function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const peers = [];
      const candidates = [];
      if (!this.agent || !this.agent.peers) return res.json(peers);
      for (const [id, peer] of Object.entries(this.agent?.peers)) {
        const candidate = {
          id: id,
          ...peer
        };
        candidates.push(candidate);
      }

      res.json(candidates);
    }
  });
};
