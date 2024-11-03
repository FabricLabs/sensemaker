'use strict';

module.exports = async function (req, res, next) {
  const { newPassword, resetToken } = req.body;

  try {
    const userReseting = await this.db('password_resets').where('token', resetToken).orderBy('id', 'desc').first();
    if (!userReseting) {
      return res.status(401).json({ message: 'Invalid reset token.' });
    }

    // Generate a salt and hash the new password
    const salt = genSaltSync(BCRYPT_PASSWORD_ROUNDS);
    const hashedPassword = hashSync(newPassword, salt);

    // Update the user's password in the database
    await this.db('users').where('id', userReseting.user_id).update({
      password: hashedPassword,
      salt: salt
    });

    return res.json({
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('Error authenticating user: ', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
