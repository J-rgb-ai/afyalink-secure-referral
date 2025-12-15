const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS facility_levels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level INTEGER NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      level_id TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      status TEXT,
      rating REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (level_id) REFERENCES facility_levels(id)
    );

    CREATE TABLE IF NOT EXISTS medical_staff (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      facility_id TEXT,
      staff_type TEXT NOT NULL,
      specialty TEXT,
      license_number TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES profiles(id),
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      referring_doctor_id TEXT NOT NULL,
      assigned_doctor_id TEXT,
      assigned_nurse_id TEXT,
      facility_from TEXT NOT NULL,
      facility_to TEXT NOT NULL,
      reason TEXT NOT NULL,
      diagnosis TEXT,
      urgency TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'in_progress', 'completed', 'rejected')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES profiles(id),
      FOREIGN KEY (referring_doctor_id) REFERENCES profiles(id),
      FOREIGN KEY (assigned_doctor_id) REFERENCES profiles(id),
      FOREIGN KEY (assigned_nurse_id) REFERENCES profiles(id)
    );
    
    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT,
      is_published BOOLEAN DEFAULT 0,
      order_index INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT,
      recipient TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT,
      is_read BOOLEAN DEFAULT 0,
      related_id TEXT,
      related_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS registration_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('admin', 'doctor', 'nurse', 'patient', 'pharmacist', 'lab_technician')),
      is_active BOOLEAN DEFAULT 1,
      max_uses INTEGER,
      uses_count INTEGER DEFAULT 0,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'doctor', 'nurse', 'patient', 'pharmacist', 'lab_technician')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    );
    
    -- Users table for authentication (separate from profiles to keep auth logic clean)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consents (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      entity_type TEXT NOT NULL, -- 'doctor', 'facility'
      entity_id TEXT, -- specific ID
      entity_name TEXT, -- cache name for display
      access_level TEXT DEFAULT 'read',
      status TEXT DEFAULT 'granted', -- 'granted', 'revoked'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES profiles(id)
    );
  `);
  
  console.log('Database schema initialized.');
}

initSchema();

module.exports = db;
