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

    //checks if there is an user with that email already
    const existingEmailUser = await this.db('users').where('email', email).first();
    if (existingEmailUser) {
      return res.status(409).json({ message: "This email is already registered for an User, please use another one." });
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
