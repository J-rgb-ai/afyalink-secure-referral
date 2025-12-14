const db = require('./db');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

async function updateAdmin() {
  const email = 'vanessakrystal231@gmail.com';
  const password = 'Passphrase123!';
  const name = 'Admin User';
  
  console.log(`Updating admin credentials for ${email}...`);

  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

  if (existingUser) {
    // Update existing user
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, existingUser.id);
    console.log('Updated password for existing user.');
    
    // Ensure admin role
    const hasRole = db.prepare('SELECT 1 FROM user_roles WHERE user_id = ? AND role = ?').get(existingUser.id, 'admin');
    if (!hasRole) {
         db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)').run(randomUUID(), existingUser.id, 'admin');
         console.log('Added admin role to user.');
    }
  } else {
    // Create new user
    const userId = randomUUID();
    db.transaction(() => {
      db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(userId, email, passwordHash);
      db.prepare('INSERT INTO profiles (id, email, full_name, status) VALUES (?, ?, ?, ?)').run(userId, email, name, 'active');
      db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)').run(randomUUID(), userId, 'admin');
    })();
    console.log('Created new admin user.');
  }
}

updateAdmin().catch(console.error);
