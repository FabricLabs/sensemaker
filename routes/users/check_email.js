'use strict';

module.exports = function (req, res) {
  const  email = req.params.id;
  res.format({
    json:async  () =>{
      try {
        const user = await this.db.select('*').from('users').where({ email: email }).first();
    
        if (user) {
          return res.status(409).json({ message: 'Email already registered. Please choose a different username.' });
        }
        res.json({ message: 'Email avaliable' });
    
      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }
    }
  })
  
};