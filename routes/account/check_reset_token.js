'use strict';

module.exports = async function (req, res, next) {
  const { resetToken } = req.body;

  try {
    // Check if the token exists

    const existingToken = await this.db('password_resets').where('token', resetToken).orderBy('id', 'desc').first();

    if (!existingToken) {
      return res.status(409).json({
        message: 'Your reset link is not valid, please try reseting your password again'
      });
    }
    // Check if the token is older than 1 hour
    const tokenAge = new Date() - new Date(existingToken.created_at);
    const oneHour = 1000 * 60 * 60; // milliseconds in one hour

    if (tokenAge > oneHour) {
      return res.status(410).json({ // 410 Gone is often used for expired resources
        message: 'Your reset token has expired, please request a new one.'
      });
    }

    return res.json({
      message: 'Token correct.',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
