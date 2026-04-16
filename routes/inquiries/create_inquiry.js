'use strict';

function escapeHtml (s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr (s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

module.exports = async function (req, res, next) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    // Check if the email already exists in the waitlist
    const existingInquiry = await this.db('inquiries').where('email', email).first();
    if (existingInquiry) {
      return res.status(409).json({ message: "You're already on the waitlist!" });
    }

    // Insert the new user into the database
    await this.db('inquiries').insert({
      email: email
    });

    if (this.email) {
      const origin = (this.settings.baseUrl || this.authority || '').replace(/\/$/, '');
      try {
        await this.email.send({
          from: 'noreply@localhost',
          to: email,
          subject: 'Sensemaker waitlist',
          text: `Thanks — we received your request for ${email}. You are on the waitlist.\n\n${origin}`,
          html: `<p>Thanks — we received your request for <strong>${escapeHtml(email)}</strong>.</p><p>You are on the waitlist.</p><p><a href="${escapeAttr(origin)}">${escapeAttr(origin)}</a></p>`
        });
      } catch (err) {
        console.error('[INQUIRIES] Waitlist confirmation email failed:', err.message);
      }
    }

    return res.json({ message: "You've been added to the waitlist!" });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.  Try again later.' });
  }
};
