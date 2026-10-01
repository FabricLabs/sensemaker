'use strict';

const { discordClientOr503 } = require('./_discordClient');

const VOICE_TYPES = new Set([2, 13]);

function serializeChannel (c) {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    parentId: c.parentId || null,
    isVoiceLike: VOICE_TYPES.has(Number(c.type))
  };
}

module.exports = async function (req, res) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const client = discordClientOr503(this, res);
      if (!client) return;
      try {
        let g = client.guilds.cache.get(req.params.guildid);
        if (!g) g = await client.guilds.fetch(req.params.guildid);
        const channels = g.channels.cache.map(serializeChannel);
        const memberIds = g.members.cache.map((m) => m.id);
        const membersMax = 500;
        res.json({
          guild: {
            id: g.id,
            name: g.name,
            icon: g.icon,
            description: g.description,
            memberCount: g.memberCount,
            approximateMemberCount: g.approximateMemberCount,
            channels,
            members: memberIds.slice(0, membersMax),
            membersTruncated: memberIds.length > membersMax,
            membersTotal: memberIds.length
          }
        });
      } catch (error) {
        console.error('Could not fetch guild:', error);
        res.status(500).json({ error: error.message || String(error) });
      }
    }
  });
};
