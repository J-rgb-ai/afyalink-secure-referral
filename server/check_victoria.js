const db = require('./db');

const email = 'victoria@gmail.com';
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

if (user) {
  console.log(`User found: ID=${user.id}, Email=${user.email}`);
  // Check profile
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(user.id);
  console.log('Profile:', profile);
  // Check roles
  const roles = db.prepare('SELECT * FROM user_roles WHERE user_id = ?').all(user.id);
  console.log('Roles:', roles);
} else {
  console.log('User not found in database.');
}
