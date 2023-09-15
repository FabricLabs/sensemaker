const readline = require('readline');

const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: 'localhost',
    user: 'db_user_jeeves',
    password: 'password',
    database: 'db_jeeves'
  }
});

const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds for bcrypt

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to add a new user
function addUser() {
  rl.question('New user name: ', (username) => {
    rl.question('New user password: ', (password) => {
      // Generate a salt
      bcrypt.genSalt(saltRounds, (err, salt) => {
        if (err) {
          console.error('Error generating salt:', err);
          rl.close();
          return;
        }
        // Hash the password with the generated salt
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            console.error('Error hashing password:', err);
            rl.close();
            return;
          }
          // Insert the new user with hashed password and salt into the DB
          knex('users')
            .insert({
              username: username,
              password: hash,
              salt: salt 
            })
            .then(() => {
              console.log('User successfully added');
              rl.close();
              process.exit(); 
            })
            .catch((error) => {
              console.error('Error registering user:', error);
              rl.close();
              process.exit();
            });
        });
      });
    });
  });
}

addUser();
