'use strict';

module.exports = function (req, res) {
  const invitationToken = req.params.id;

  res.format({
    json:async () => {
      try {
        const invitation = await this.db.select('*').from('invitations').where({ token: invitationToken }).first();
    
        if (!invitation) {
          return res.status(404).json({ message: 'Invalid invitation token' });
        }
    
        const updateResult = await this.db('invitations')
          .where({ token: invitationToken })
          .update({
            updated_at: new Date(),
            status: 'accepted',
          });
    
        if (!updateResult) {
          return res.status(500).json({ message: 'Error updating the invitation status.' });
        }
    
        res.send({
          message: 'Invitation accepted successfully!'
        });
    
      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }
    
    }
  })

};