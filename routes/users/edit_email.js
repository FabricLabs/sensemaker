'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const { id , newUsername } = req.body;

      try {
        const userAdmin = await this.db.select('is_admin').from('users').where({ id: req.user.id }).first();

        if (!userAdmin || userAdmin.is_admin !== 1) {
          return res.status(401).json({ message: 'User not allowed to edit other Users.' });
        }

        const user = await this.db('users').where('id', id).first();

        // Check if the username already exists
        const existingUser = await this.db('users').where('username', newUsername).first();
        if (existingUser) {
          return res.status(409).json({ message: 'Username already exists.' });
        }
        // Update the user's username in the database
        await this.db('users').where('id', user.id).update({
          username: newUsername,
          updated_at: new Date(),
        });

        return res.json({
          message: 'Username updated successfully.',
        });
      } catch (error) {
        return res.status(500).json({ message: 'Internal server error.' });
      }
    }
  });
};


