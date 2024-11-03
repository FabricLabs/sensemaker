'use strict';

module.exports = async function (req, res, next) {
  let identity = null;
  try {
    const user = await this.db('users').where('id', req.user.id).first();
    if (!user) {
      return res.status(401).json({ message: 'Invalid session.' });
    }

    if (user.discord_id) {
      identity = await this.db('identities').where('user_id', req.user.id).where('type', 'DiscordUsername').first();
    }

    return res.json({
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      isBeta: user.is_beta,
      isCompliant: user.is_compliant,
      user_discord: (identity) ? {
        id: user.discord_id,
        username: identity.content,
      } : undefined,
      id: user.id
    });
  } catch (error) {
    console.error('Error authenticating user: ', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
