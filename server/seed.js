const db = require('./db');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

async function seed() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'admin@afyalink.com', name: 'Admin User', role: 'admin' },
    { email: 'doctor@afyalink.com', name: 'Dr. John Doe', role: 'doctor' },
    { email: 'nurse@afyalink.com', name: 'Nurse Jane', role: 'nurse' },
    // Test patient removed - patients should register through the system
  ];

  const createUser = db.transaction((user) => {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
    if (existing) return;

    const id = randomUUID();
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, user.email, passwordHash);
    db.prepare('INSERT INTO profiles (id, email, full_name, status) VALUES (?, ?, ?, ?)').run(id, user.email, user.name, 'active');
    
    // Assign role
    db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)').run(randomUUID(), id, user.role);

    console.log(`Created user: ${user.email} (${user.role})`);
  });

  users.forEach(createUser);

  console.log('Seeding complete. Password for all users is: password123');
}

seed().catch(console.error);
