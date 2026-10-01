'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const { id , newEmail } = req.body;

      try {
        if (!(await this._assertSensemakerAdminJson(req, res))) return;

        const user = await this.db('users').where('id', id).first();

        // Check if the email already exists
        const existingEmail = await this.db('users').where('email', newEmail).first();
        if (existingEmail) {
          return res.status(409).json({ message: 'Email already registered.' });
        }
        // Update the user's username in the database
        await this.db('users').where('id', user.id).update({
          email: newEmail,
          updated_at: new Date(),
        });

        return res.json({
          message: 'Email updated successfully.',
        });
      } catch (error) {
        return res.status(500).json({ message: 'Internal server error.' });
      }
    }
  });
};


