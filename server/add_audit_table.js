const db = require('./db');

console.log('Adding audit_logs table...');

db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      type TEXT, -- 'success', 'warning', 'error', 'info'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );
`);

console.log('Table audit_logs created successfully.');
