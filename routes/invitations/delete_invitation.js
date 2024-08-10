'use strict';

module.exports = function (req, res)  {
  const invitationID = req.params.id;
  res.format({
    json:async() => {
      try {
        const invitation = await this.db.select('*').from('invitations').where({ id: invitationID }).first();
    
        if (!invitation) {
          return res.status(404).json({ message: 'Invalid invitation' });
        }
    
        // update the invitation status to deleted from the invitations list
        const invitationDeleteStatus = await this.db('invitations')
          .where({ id: invitationID })
          .update({
            updated_at: new Date(),
            status: 'deleted',
          });
    
        if (!invitationDeleteStatus) {
          return res.status(500).json({ message: 'Error deleting the invitation.' });
        }
    
        res.send({
          message: 'Invitation deleted successfully!'
        });
    
      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }
    }
  })

};