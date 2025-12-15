const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');


const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

// Helper to generate UUID if crypto is not available (Node < 14.17), but User has Node 20+ likely.
const { randomUUID } = require('crypto');

// Middleware to check if user is authenticated
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Helper to log audit events
const logAudit = (userId, action, details, type = 'info') => {
  try {
    db.prepare('INSERT INTO audit_logs (id, user_id, action, details, type) VALUES (?, ?, ?, ?, ?)').run(
      randomUUID(), userId, action, details, type
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

router.post('/signup', async (req, res) => {
  const { email, password, full_name, role_code } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const userExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    // Transaction to create user and profile
    const createUser = db.transaction(() => {
      db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(userId, email, hashedPassword);
      // Explicitly set status to 'pending'
      db.prepare('INSERT INTO profiles (id, email, full_name, status) VALUES (?, ?, ?, ?)').run(userId, email, full_name, 'pending');
      
      if (role_code) {
         let role = null;
         if (role_code.includes('ADMIN')) role = 'admin';
         else if (role_code.includes('DOCTOR')) role = 'doctor';
         else if (role_code.includes('NURSE')) role = 'nurse';
         else if (role_code.includes('PATIENT')) role = 'patient';
         
         if (role) {
            db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)').run(randomUUID(), userId, role);
         }
      }
    });

    createUser();
    logAudit(userId, 'USER_SIGNUP', `User ${email} registered`, 'info');

    const token = jwt.sign({ id: userId, email }, SECRET_KEY, { expiresIn: '24h' });
    
    res.json({ message: 'Account created. Please wait for admin approval.', user: { id: userId, email, full_name } }); 
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      logAudit(null, 'LOGIN_FAILED', `Failed login attempt for ${email} (User not found)`, 'warning');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      logAudit(user.id, 'LOGIN_FAILED', `Failed login attempt for ${email} (Invalid password)`, 'warning');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(user.id);
    
    // Check status
    if (profile.status !== 'active') {
       logAudit(user.id, 'LOGIN_FAILED', `Login attempted for inactive account ${email}`, 'warning');
       return res.status(403).json({ error: 'Account pending approval. Please contact administrator.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
    
    logAudit(user.id, 'LOGIN_SUCCESS', `User ${email} logged in successfully`, 'success');

    res.cookie('token', token, { httpOnly: true, secure: false });
    res.json({ user: { ...profile, email: user.email }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  // If we have user info from middleware (though logout might be called without auth sometimes, or token expired)
  // We don't have middleware here in the original code, checking index.js usage might clarify but standard is clearCookie
  // We can't easily log *who* logged out unless we require auth for logout or decode the cookie first.
  // For now, simpler to just clear.
  
  // Attempt to decode for logging if token exists
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  if (token) {
      try {
        const decoded = jwt.verify(token, SECRET_KEY);
        logAudit(decoded.id, 'LOGOUT', `User ${decoded.email} logged out`, 'info');
      } catch(e) {}
  }

  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'User not found' });
  
  const roles = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(req.user.id).map(r => r.role);
  
  res.json({ user: { ...profile, email: req.user.email, roles } });
});

module.exports = router;
