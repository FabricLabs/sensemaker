'use strict';

const { hashSync, genSaltSync } = require('bcrypt');

module.exports = function (req, res) {
  const { username, password, email, firstName, lastName, firmName, firmSize } = req.body;
  res.format({
    json: async () => {
      // Check if the username and password are provided
      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password are required." });
      }

      try {
        // Check if the username already exists
        const existingUser = await this.db("users")
          .where("username", username)
          .first();
        if (existingUser) {
          return res.status(409).json({ message: "Username already exists." });
        }

        // Check if the email already exists
        const existingEmail = await this.db("users")
          .where("email", email)
          .first();
        if (existingUser) {
          return res.status(409).json({ message: "Email already registered." });
        }

        // Generate a salt and hash the password
        const saltRounds = 10;
        const salt = genSaltSync(saltRounds);
        const hashedPassword = hashSync(password, salt);

        // Insert the new user into the database
        const newUser = await this.db("users").insert({
          username: username,
          password: hashedPassword,
          salt: salt,
          email: email,
          first_name: firstName,
          last_name: lastName
        });

        console.log("New user registered:", username);

        return res.json({ message: "User registered successfully." });
      } catch (error) {
        console.error("Error registering user: ", error);
        return res.status(500).json({ message: "Internal server error." });
      }
    },
  });

};
