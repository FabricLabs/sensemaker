'use strict';

// Dependencies
const { hashSync, compareSync, genSaltSync } = require('bcrypt'); // user authentication

const Token = require('@fabric/core/types/token');

module.exports = async function (req, res, next) {
  const { username, password } = req.body;
  // console.debug('handling incoming login:', username, `${password ? '(' + password.length + ' char password)' : '(no password'} ...`);

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await this.db('users').where('username', username).first();
    if (!user || !compareSync(password, user.password)) return res.status(401).json({ message: 'Invalid username or password.' });

    // Set Roles
    const roles = ['user'];

    // Special Roles
    if (user.is_admin) roles.unshift('admin');
    if (user.is_alpha || user.is_admin) roles.unshift('alpha');
    if (user.is_beta || user.is_alpha || user.is_admin) roles.unshift('beta');

    // Create Token
    const token = new Token({
      capability: 'OP_IDENTITY',
      issuer: null,
      subject: user.id + '', // String value of integer ID
      state: {
        roles: roles
      }
    });

    return res.json({
      message: 'Authentication successful.',
      token: token.toString(),
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      isBeta: user.is_beta,
      isCompliant: user.is_compliant
    });
  } catch (error) {
    console.error('Error authenticating user: ', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
