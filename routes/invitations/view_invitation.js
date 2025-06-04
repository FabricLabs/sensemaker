'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      console.debug('viewing invitation details...');
      // if (!req.user || !req.user.state || !req.user.state.roles.includes('admin')) return res.status(401).json({ message: 'Unauthorized.' });
      try {
        const invitationId = req.params.id;
        const invitation = await this.db('invitations').where({ fabric_id: invitationId }).first();
        if (!invitation) {
          return res.status(404).json({ message: 'Invitation not found.' });
        }
        console.debug('got invitation:', invitation);
        res.send(invitation);
      } catch (error) {
        console.error('Error fetching invitation:', error);
        res.status(500).json({ message: 'Internal server error.' });
      }
    },
    html: () => {
      return res.send(this.applicationString);
    }
  });
}
