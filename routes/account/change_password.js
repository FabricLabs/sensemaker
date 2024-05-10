'use strict';

module.exports = function (req, res, next) {
  const { oldPassword, newPassword } = req.body;
  res.format({
    json:async () => {
      try {
        const user = await this.db('users').where('id', req.user.id).first();
        if (!user || !compareSync(oldPassword, user.password)) {
          return res.status(401).json({ message: 'Invalid password.' });
        }
    
        // Generate a salt and hash the new password
        const saltRounds = 10;
        const salt = genSaltSync(saltRounds);
        const hashedPassword = hashSync(newPassword, salt);
    
        // Update the user's password in the database
        await this.db('users').where('id', user.id).update({
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
    }
  })
};