'use strict';

const { discordClientOr503 } = require('./_discordClient');

const VOICE_TYPES = new Set([2, 13]);

module.exports = async function (req, res) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const client = discordClientOr503(this, res);
      if (!client) return;
      try {
        const channels = [];
        for (const g of client.guilds.cache.values()) {
          for (const c of g.channels.cache.values()) {
            channels.push({
              id: c.id,
              name: c.name,
              type: c.type,
              guildId: g.id,
              guildName: g.name,
              parentId: c.parentId || null,
              isVoiceLike: VOICE_TYPES.has(Number(c.type))
            });
          }
        }
        res.json({ channels });
      } catch (error) {
        console.error('Could not list channels:', error);
        res.status(500).json({ error: error.message || String(error) });
      }
    }
  });
};
