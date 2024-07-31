'use strict';

module.exports = function (req, res, next) {
  const { newUsername, password } = req.body;
  res.format({
    json:async () => {
      try {
        const user = await this.db('users').where('id', req.user.id).first();
        //check for the password
        if (!user || !compareSync(password, user.password)) {
          return res.status(401).json({ message: 'Invalid password.' });
        }
    
        // Check if the username already exists
        const existingUser = await this.db('users').where('username', newUsername).first();
        if (existingUser) {
          return res.status(409).json({ message: 'Username already exists.' });
        }
    
        // Update the user's username in the database
        await this.db('users').where('id', user.id).update({
          username: newUsername,
        });
    
        return res.json({
          message: 'Username updated successfully.',
        });
      } catch (error) {
        return res.status(500).json({ message: 'Internal server error.' });
      }
    }
  })
};