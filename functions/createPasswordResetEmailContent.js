'use strict';

module.exports = function createPasswordResetEmailContent (resetLink, imgSrc) {
  return `<html>
    <body>
      <div>
        <h3>Password Reset Request</h3>
        <p>You have requested to reset your password.  Please click the button below to set a new password.</p>
        <a href=${resetLink} class="button" target="_blank">Reset Password</a>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
    </body>
  </html>`;
};
