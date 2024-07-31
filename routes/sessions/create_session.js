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
    //now we are letting users to log in with email, so here it checks if its an email or username

    const isEmail = username.includes('@');
    let user;
    
    if (isEmail) {
      user = await this.db('users').where('email', username).first();
      if (!user || !compareSync(password, user.password)) return res.status(401).json({ message: 'Invalid email or password.' });
    } else {
      user = await this.db('users').where('username', username).first();
      if (!user || !compareSync(password, user.password)) return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Set Roles
    const roles = ['user'];

    // Special Roles
    if (user.is_admin) roles.unshift('admin');
    if (user.is_beta) roles.unshift('beta');

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
      isCompliant: user.is_compliant,
      id: user.id
    });
  } catch (error) {
    console.error('Error authenticating user: ', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
