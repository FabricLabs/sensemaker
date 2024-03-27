'use strict';

module.exports = function (req, res) {
  res.format({
    json:async () => {
      try {
        const invitations = await this.db('invitations')
        .join('users', 'invitations.sender_id', '=', 'users.id')
        .select('invitations.*', 'users.username as sender_username')
        .orderBy('invitations.created_at', 'desc');
    
        res.send(invitations);
      } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
    
  }) 
  
};