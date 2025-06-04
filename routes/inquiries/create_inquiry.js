'use strict';

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
    const newInquiry = await this.db('inquiries').insert({
      email: email
    });

    return res.json({ message: "You've been added to the waitlist!" });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error.  Try again later.' });
  }
};
