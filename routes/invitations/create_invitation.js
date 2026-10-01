'use strict';

// Dependencies
const crypto = require('crypto');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

// Functions
const createInvitationEmailContent = require('../../functions/createInvitationEmailContent');

module.exports = function (req, res) {
  const { email: rawEmail } = req.body;
  res.format({
    json: async () => {
      try {
        const email = String(rawEmail || '').trim();
        if (!email) {
          return res.status(400).json({ message: 'Email is required.' });
        }

        if (!(await this._assertSensemakerAdminJson(req, res))) return;
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const inserted = await this.db('invitations').insert({
          sender_id: req.user.id,
          target: email,
          token: invitationToken
        });

        const invitationId = Array.isArray(inserted) ? inserted[0] : inserted;
        const invitation = await this.db('invitations').where({ id: invitationId }).first();
        const actor = new Actor({ name: `sensemaker/invitations/${invitation.id}`});
        await this.db('invitations').where({ id: invitation.id }).update({
          fabric_id: actor.id
        });

        // Mark matching waitlist row as invited when present (optional — modal invites may skip the waitlist)
        const inquiryRows = await this.db('inquiries')
          .whereRaw('LOWER(TRIM(email)) = ?', [email.toLowerCase()])
          .update({
            updated_at: new Date(),
            status: 'invited',
          });

        if (!inquiryRows) {
          console.warn('[INVITATIONS] No inquiries row matched for invitation target:', email);
        }

        if (this.email) {
          const origin = (this.settings.baseUrl || this.authority || '').replace(/\/$/, '');
          const acceptInvitationLink = `${origin}/invitations/${actor.id}?action=accept&token=${invitationToken}`;
          const declineInvitationLink = `${origin}/invitations/${actor.id}?action=decline&token=${invitationToken}`;
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
            id: invitation.id,
            fabric_id: actor.id
          }
        });
      } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Error sending invitation.' });
      }
    }
  });
};
