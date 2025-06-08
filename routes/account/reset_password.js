'use strict';

const crypto = require('crypto');
const createPasswordResetEmailContent = require('../../functions/createPasswordResetEmailContent');

module.exports = async function (req, res, next) {
  const { email } = req.body;

  try {
    // Check if the email exists
    const existingUser = await this.db('users').where('email', email).first();

    // Generate a unique token
    let uniqueTokenFound = false;
    let resetToken = '';

    if (existingUser) {
      while (!uniqueTokenFound) {
        resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExists = await this.db.select('*').from('password_resets').where({ token: resetToken }).first();
        if (!tokenExists) {
          uniqueTokenFound = true;
        }
      }

      const newReset = await this.db('password_resets').insert({
        user_id: existingUser.id,
        token: resetToken
      });

      // TODO: refactor this link
      const resetLink = `${this.authority}/passwordreset/${resetToken}`;
      const imgSrc = 'https://sensemaker.io/images/sensemaker-icon.png';
      const htmlContent = createPasswordResetEmailContent(resetLink, imgSrc);

      try {
        await this.email.send({
          from: 'agent@sensemaker.io',
          to: email,
          subject: 'Password Reset',
          html: htmlContent
        });
      } catch (error) {
        console.error('Error sending email', error);
        return res.status(500).json({ message: 'Failed to send password reset email. Please try again later.' });
      }
    }

    // Always return success message, even if email doesn't exist (for security)
    return res.json({
      message: 'If the email address exists, a password reset link has been sent to it.',
    });
  } catch (error) {
    console.error('Error processing request', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
