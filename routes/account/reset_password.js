'use strict';

const createPasswordResetEmailContent = require('../../functions/createPasswordResetEmailContent');

module.exports = async function (req, res, next) {
  const { email } = req.body;

  try {
    // Check if the email exists
    const existingUser = await this.db('users').where('email', email).first();
    if (!existingUser) {
      return res.status(409).json({
        message: 'This email you entered is not assigned to a registered user. Please check and try again or contact client services on support@sensemaker.io'
      });
    }

    // Generate a unique token
    let uniqueTokenFound = false;
    let resetToken = '';
    while (!uniqueTokenFound) {
      resetToken = crypto.randomBytes(20).toString('hex');
      const tokenExists = await this.db.select('*').from('password_resets').where({ token: resetToken }).first();
      if (!tokenExists) {
        uniqueTokenFound = true;
      }
    };

    const newReset = await this.db('password_resets').insert({
      user_id: existingUser.id,
      token: resetToken,
    });

    const resetLink = `${this.authority}/passwordreset/${resetToken}`;
    const imgSrc = 'https://sensemaker.io/images/sensemaker-icon.png';
    const htmlContent = createPasswordResetEmailContent(resetLink,imgSrc);

    try {
      await this.email.send({
        from: 'agent@sensemaker.io',
        to: email,
        subject: 'Password Reset',
        html: htmlContent
      });

      return res.json({
        message: 'Token sent successfully.',
      });
    } catch (error) {
      console.error('Error sending email', error);
      return res.status(500).json({
        message: 'Email could not be sent. Please try again later or contact client services on support@sensemaker.io'
      });
    }
  } catch (error) {
    console.error('Error processing request', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
