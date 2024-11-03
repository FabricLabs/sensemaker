'use strict';

module.exports = function createInvitationEmailContent (acceptLink, declineLink, imgSrc) {
  return `<html>
    <body>
      <div>
        <h3>Hello, You have been invited to join Sensemaker.</h3>
        <a href=${acceptLink} class="button" target="_blank">Join Sensemaker</a>
        <p>If you prefer not to receive future invitations, <a href=${declineLink} class="decline">click here</a>.</p>
      </div>
    </body>
  </html>`;
};
