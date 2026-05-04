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
        const ch = await client.channels.fetch(req.params.id);
        const base = {
          id: ch.id,
          name: ch.name,
          type: ch.type,
          guildId: ch.guildId || null,
          isVoiceLike: VOICE_TYPES.has(Number(ch.type))
        };
        let memberUserIds = [];
        if (ch.members && typeof ch.members.cache !== 'undefined') {
          memberUserIds = ch.members.cache.map((m) => m.id);
        }
        res.json({
          channel: {
            ...base,
            memberUserIds
          }
        });
      } catch (error) {
        console.error('Could not fetch channel:', error);
        res.status(500).json({ error: error.message || String(error) });
      }
    }
  });
};
