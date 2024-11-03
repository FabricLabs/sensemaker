'use strict';

// Dependencies
const crypto = require('crypto');

// Functions
const createInvitationEmailContent = require('../../functions/createInvitationEmailContent');

module.exports = function (req, res)  {
  const { email } = req.body;
  res.format({
    json:async () => {
      try {
        const user = await this.db.select('is_admin').from('users').where({ id: req.user.id }).first();
        if (!user || user.is_admin !== 1) {
          return res.status(401).json({ message: 'User not allowed to send Invitations.' });
        }

        // Generate a unique token
        let uniqueTokenFound = false;
        let invitationToken = '';

        while (!uniqueTokenFound) {
          invitationToken = crypto.randomBytes(20).toString('hex');
          const tokenExists = await this.db.select('*').from('invitations').where({ token: invitationToken }).first();
          if (!tokenExists) {
            uniqueTokenFound = true;
          }
        };

        const acceptInvitationLink = `${this.authority}/signup/${invitationToken}`;
        const declineInvitationLink = `${this.authority}/signup/decline/${invitationToken}`;
        // TODO: serve from assets (@nplayer89)
        const imgSrc = 'https://sensemaker.io/images/sensemaker-icon.png';
        const htmlContent = createInvitationEmailContent(acceptInvitationLink, declineInvitationLink, imgSrc);

        await this.email.send({
          from: 'agent@sensemaker.io',
          to: email,
          subject: 'Your Sensemaker Invitation',
          html: htmlContent
        });

        const existingInvite = await this.db.select('*').from('invitations').where({ target: email }).first();
        if (!existingInvite) {
          const invitation = await this.db('invitations').insert({
            sender_id: req.user.id,
            target: email,
            token: invitationToken
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
        } else {
          return res.status(500).json({ message: 'Error: Invitation already exist.' });
        }
        res.send({
          message: 'Invitation created successfully!'
        });
      } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Error sending invitation.' });
      }
    }
  });
};
