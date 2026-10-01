'use strict';

function discordClientOr503 (sensemaker, res) {
  if (!sensemaker.discord || !sensemaker.discord.client) {
    res.status(503).json({ error: 'Discord integration is disabled or not connected.' });
    return null;
  }
  return sensemaker.discord.client;
}

module.exports = { discordClientOr503 };
