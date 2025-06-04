'use strict';

module.exports = function (req, res) {
  const  invitationToken = req.params.id;
  res.format({
    json:async () => {
      try {
        const invitation = await this.db.select('*').from('invitations').where({ token: invitationToken }).first();
        if (!invitation) return res.status(404).json({ message: 'Your invitation link is not valid.' });

        // Check if the invitation has already been accepted or declined
        if (invitation.status === 'accepted') {
          return res.status(409).json({
            message: 'This invitation has already been accepted. If you believe this is an error or if you need further assistance, please do not hesitate to contact our support team at support@sensemaker.io.'
          });
        } else if (invitation.status === 'declined') {
          return res.status(409).json({
            message: 'You have previously declined this invitation. If this was not your intention, or if you have any questions, please feel free to reach out to our support team at support@sensemaker.io for assistance.'
          });
        }

        // Check if the token is older than 30 days
        const tokenAgeInDays = (new Date() - new Date(invitation.updated_at)) / (1000 * 60 * 60 * 24);
        if (tokenAgeInDays > 30) {
          return res.status(410).json({ message: 'Your invitation link has expired.' });
        }

        res.json({ message: 'Invitation token is valid and pending.', invitation });
      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }
    }
  })
};
