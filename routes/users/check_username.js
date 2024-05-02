'use strict';

module.exports = function (req, res) {
  const  username = req.params.id;
  res.format ({
    json:async () => {
      try {
        const user = await this.db.select('*').from('users').where({ username: username }).first();
    
        if (user) {
          return res.status(409).json({ message: 'Username already exists. Please choose a different username.' });
        }
        res.json({ message: 'Username avaliable' });
    
      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }
    }
  })

};