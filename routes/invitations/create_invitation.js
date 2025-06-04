'use strict';

// Dependencies
const crypto = require('crypto');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

// Functions
const createInvitationEmailContent = require('../../functions/createInvitationEmailContent');

module.exports = function (req, res) {
  const { email } = req.body;
  res.format({
    json: async () => {
      try {
        const user = await this.db.select('is_admin').from('users').where({ id: req.user.id }).first();
        if (!user || user.is_admin !== 1) return res.status(401).json({ message: 'User not allowed to send Invitations.' });
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const inserted = await this.db('invitations').insert({
          sender_id: req.user.id,
          target: email,
          token: invitationToken
        });

        const invitation = await this.db('invitations').where({ id: inserted[0] }).first();
        const actor = new Actor({ name: `sensemaker/invitations/${invitation.id}`});
        await this.db('invitations').where({ id: invitation.id }).update({
          fabric_id: actor.id
        });

        // update the inquiry status to invited from the waitlist
        const inquiryInvitedStatus = await this.db('inquiries')
          .where({ email: email })
          .update({
            updated_at: new Date(),
            status: 'invited',
          });

        if (!inquiryInvitedStatus) {
          return res.status(500).json({ message: 'Error updating the inquiry.' });
        }

        if (this.email) {
          const acceptInvitationLink = `${this.authority}/invitations/${actor.id}?action=accept&token=${invitationToken}`;
          const declineInvitationLink = `${this.authority}/invitations/${actor.id}?action=decline&token=${invitationToken}`;
          // TODO: serve from assets (@nplayer89)
          const imgSrc = 'https://sensemaker.io/images/sensemaker-icon.png';
          const htmlContent = createInvitationEmailContent(acceptInvitationLink, declineInvitationLink, imgSrc);

          await this.email.send({
            from: 'agent@sensemaker.io',
            to: email,
            subject: 'Your Sensemaker Invitation',
            html: htmlContent
          });
        }

        res.send({
          message: 'Invitation created successfully!',
          content: {
            id: invitation[0]
          }
        });
      } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Error sending invitation.' });
      }
    }
  });
};
