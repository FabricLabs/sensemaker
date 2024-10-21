/**
 * @api {post} /sessions Create Session
 * @apiName CreateSession
 * @apiGroup Sessions
 * @apiDescription Create a new session for a user.
 * @apiVersion 1.0.0
 * @apiPermission user
 * @apiParam {String} username The username of the user.
 * @apiParam {String} password The password of the user.
 * @apiParam {String} token The token of the user.
 */
'use strict';

// Dependencies
const { hashSync, compareSync, genSaltSync } = require('bcrypt'); // user authentication

// Fabric Types
const Token = require('@fabric/core/types/token');

// Exports an Express.js middleware function
module.exports = async function (req, res, next) {
  let user = null;
  let identity = null;
  let snowflake = null;
  let credential = null;

  const { username, password, token } = req.body;
  const roles = ['user'];
  // console.debug('handling incoming login:', username, `${password ? '(' + password.length + ' char password)' : '(no password'} ...`);

  if (token) {
    credential = await this.db('credentials').where('content', token).first();
    if (credential && credential.user_id) {
      user = await this.db('users').where('id', credential.user_id).first();
      if (!user) return res.status(401).json({ message: 'Invalid token.' });
    }
  }

  if (!token && !user && (!username || !password)) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  if (!user) {
    try {
      //now we are letting users to log in with email, so here it checks if its an email or username
      const isEmail = username.includes('@');
  
      if (isEmail) {
        user = await this.db('users').where('email', username).first();
        if (!user || !compareSync(password, user.password)) return res.status(401).json({ message: 'Invalid email or password.' });
      } else {
        user = await this.db('users').where('username', username).first();
        if (!user || !compareSync(password, user.password)) return res.status(401).json({ message: 'Invalid username or password.' });
      }

      // Special Roles
      if (user.is_admin) roles.unshift('admin');
      if (user.is_beta) roles.unshift('beta');
    } catch (error) {
      console.error('Error authenticating user: ', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  if (user.discord_id) {
    snowflake = await this.db('identities').where('user_id', user.id).where('type', 'DiscordUserSnowflake').first();
    identity = await this.db('identities').where('user_id', user.id).where('type', 'DiscordUsername').first();
  }

  // Create Token
  const access_token = new Token({
    capability: 'OP_IDENTITY',
    issuer: null,
    subject: user.id + '', // String value of integer ID
    state: {
      roles: roles
    }
  });

  // TODO: sign token
  // TODO: validate token after signing

  res.format({
    json: function () {
      res.json({
        message: 'Authentication successful.',
        token: access_token.toString(),
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin,
        isBeta: user.is_beta,
        isCompliant: user.is_compliant,
        user_discord: {
          id: user.discord_id,
          username: identity?.content
        },
        id: user.id
      });
    },
    html: function () {
      const next = (req.query.next || '/').replace(/[^a-zA-Z0-9\/]/g, '');
      res.cookie('token', access_token.toString(), { httpOnly: true });
      res.redirect(next);
    }
  });
}
