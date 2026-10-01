'use strict';

/**
 * Admin-only: accumulated voice stats and active voice channels from @fabric/discord.
 */
module.exports = async function (req, res) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      if (!(await this._assertSensemakerAdminJson(req, res))) return;
      if (!this.discord || typeof this.discord.voice !== 'object') {
        return res.status(503).json({ error: 'Discord integration is disabled or not connected.' });
      }
      const client = this.discord.client;
      res.json({
        voice: this.discord.voice,
        botTag: client && client.user ? client.user.tag : null,
        botId: client && client.user ? client.user.id : null,
        fetchedAt: Date.now()
      });
    }
  });
};
