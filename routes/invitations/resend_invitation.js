'use strict';

const crypto = require('crypto');
const Actor = require('@fabric/core/types/actor');

const createInvitationEmailContent = require('../../functions/createInvitationEmailContent');

module.exports = function (req, res) {
  res.format({
    json: async () => {
      try {
        if (!(await this._assertSensemakerAdminJson(req, res))) return;

        // Generate a unique token
        let uniqueTokenFound = false;
        let invitationToken = '';
        while (!uniqueTokenFound) {
          invitationToken = crypto.randomBytes(32).toString('hex');
          const tokenExists = await this.db.select('*').from('invitations').where({ token: invitationToken }).first();
          if (!tokenExists) {
            uniqueTokenFound = true;
          }
        };

        const invitation = await this.db.select(['id', 'target']).from('invitations').where({ id: req.params.id }).first();
        const actor = new Actor({ name: `sensemaker/invitations/${invitation.id}`});
        const origin = (this.settings.baseUrl || this.authority || '').replace(/\/$/, '');
        const acceptInvitationLink = `${origin}/invitations/${actor.id}?action=accept&token=${invitationToken}`;
        const declineInvitationLink = `${origin}/invitations/${actor.id}?action=decline&token=${invitationToken}`;
        const imgSrc = "https://sensemaker.io/images/fabric-labs.png";
        const htmlContent = createInvitationEmailContent(acceptInvitationLink, declineInvitationLink, imgSrc);
        await this.email.send({
          from: 'agent@sensemaker.io',
          to: invitation.target,
          subject: 'Invitation to join Sensemaker',
          html: htmlContent
        });

        const updateResult = await this.db('invitations')
          .where({ id: req.params.id })
          .increment('invitation_count', 1)
          .update({
            updated_at: new Date(),
            sender_id: req.user.id,
            token: invitationToken
          });
    
        if (!updateResult) {
          return res.status(500).json({ message: 'Error updating the invitation count.' });
        }

        res.send({
          message: 'Invitation re-sent successfully!'
        });
      } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Error sending invitation.' });
      }
    }
  })
};
