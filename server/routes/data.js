const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

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

router.use(authenticateToken);

// === Referrals ===
router.get('/referrals', (req, res) => {
  try {
    const roles = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(req.user.id).map(r => r.role);
    let query = `
      SELECT r.*, 
             p_patient.full_name as patient_name, p_patient.email as patient_email,
             p_doctor.full_name as referring_doctor_name,
             p_assigned.full_name as assigned_doctor_name,
             p_nurse.full_name as assigned_nurse_name
      FROM referrals r
      LEFT JOIN profiles p_patient ON r.patient_id = p_patient.id
      LEFT JOIN profiles p_doctor ON r.referring_doctor_id = p_doctor.id
      LEFT JOIN profiles p_assigned ON r.assigned_doctor_id = p_assigned.id
      LEFT JOIN profiles p_nurse ON r.assigned_nurse_id = p_nurse.id
    `;
    
    let params = [];

    if (roles.includes('patient')) {
      query += ` WHERE r.patient_id = ?`;
      params.push(req.user.id);
    } else if (roles.includes('doctor')) {
      query += ` WHERE r.referring_doctor_id = ? OR r.assigned_doctor_id = ?`;
      params.push(req.user.id, req.user.id);
    } else if (roles.includes('nurse')) {
       query += ` WHERE r.assigned_nurse_id = ?`;
       params.push(req.user.id);
    }
    
    query += ` ORDER BY r.created_at DESC`;

    const rawReferrals = db.prepare(query).all(...params);
    
    // Transform to nested structure to match frontend expectations
    const referrals = rawReferrals.map(r => ({
      ...r,
      patient: { full_name: r.patient_name, email: r.patient_email },
      referring_doctor: { full_name: r.referring_doctor_name },
      assigned_doctor: r.assigned_doctor_name ? { full_name: r.assigned_doctor_name } : null,
      assigned_nurse: r.assigned_nurse_name ? { full_name: r.assigned_nurse_name } : null,
    }));

    res.json(referrals);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

router.post('/referrals', (req, res) => {
  const { patient_id, patientEmail, facility_from, facility_to, reason, urgency, diagnosis, notes } = req.body;
  const { randomUUID } = require('crypto');
  
  try {
    let finalPatientId = patient_id;

    if (!finalPatientId && patientEmail) {
      const patient = db.prepare('SELECT id FROM profiles WHERE email = ?').get(patientEmail);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found with this email' });
      }
      finalPatientId = patient.id;
    }

    if (!finalPatientId) {
       return res.status(400).json({ error: 'Patient ID or Email is required' });
    }

    const id = randomUUID();
    const status = 'pending';
    
    // Defaults
    const referring_doctor_id = req.user.id; 

    db.prepare(`
      INSERT INTO referrals (id, patient_id, referring_doctor_id, facility_from, facility_to, reason, urgency, status, diagnosis, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, finalPatientId, referring_doctor_id, facility_from, facility_to, reason, urgency, status, diagnosis, notes);

    res.json({ message: 'Referral created', id });
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

router.put('/referrals/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
     const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
     const values = Object.values(updates);
     
     if (fields.length === 0) return res.json({ success: true });

     db.prepare(`UPDATE referrals SET ${fields} WHERE id = ?`).run(...values, id);
     res.json({ success: true });
  } catch (error) {
    console.error('Error updating referral:', error);
    res.status(500).json({ error: 'Failed to update referral' });
  }
});

// === Admin & Stats ===
router.get('/admin/stats', (req, res) => {
    try {
        const stats = {
            totalUsers: db.prepare('SELECT COUNT(*) as c FROM profiles').get().c,
            totalReferrals: db.prepare('SELECT COUNT(*) as c FROM referrals').get().c,
            totalCodes: db.prepare('SELECT COUNT(*) as c FROM registration_codes').get().c,
            pendingReferrals: db.prepare("SELECT COUNT(*) as c FROM referrals WHERE status = 'pending'").get().c,
            pendingUsers: db.prepare("SELECT COUNT(*) as c FROM profiles WHERE status = 'pending'").get().c,
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

router.get('/admin/users/pending', (req, res) => {
    try {
        const users = db.prepare("SELECT id, email, full_name, created_at FROM profiles WHERE status = 'pending' ORDER BY created_at DESC").all();
        const usersWithRoles = users.map(u => {
            const roles = db.prepare("SELECT role FROM user_roles WHERE user_id = ?").all(u.id).map(r => r.role);
            return { ...u, roles };
        });
        res.json(usersWithRoles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending users' });
    }
});

router.get('/admin/users/providers', (req, res) => {
    try {
        // Fetch users who have roles (excluding admin/patient)
        // We need: id, email, full_name, status, role, facility_name
        
        // 1. Get all users with roles
        const users = db.prepare(`
            SELECT p.id, p.email, p.full_name, p.status, ur.role, f.name as facility_name, ms.status as staff_status
            FROM profiles p
            JOIN user_roles ur ON p.id = ur.user_id
            LEFT JOIN medical_staff ms ON p.id = ms.user_id
            LEFT JOIN facilities f ON ms.facility_id = f.id
            WHERE ur.role NOT IN ('admin', 'patient')
        `).all();
        
        // Transform if necessary, or just return. 
        // Note: The previous logic iterated users and roles separately. 
        // A direct join is more efficient.
        
        // We might have duplicates if a user has multiple roles? 
        // But in this system, it seems 1 role per user is standard for now.
        
        res.json(users);
    } catch (error) {
         console.error("Error fetching providers:", error);
         res.status(500).json({ error: 'Failed to fetch providers' });
    }
});

router.post('/admin/users/:id/activate', (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        db.transaction(() => {
            if (role) {
                db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)').run(require('crypto').randomUUID(), id, role);
            }
            db.prepare("UPDATE profiles SET status = 'active' WHERE id = ?").run(id);
        })();
        res.json({ success: true });
    } catch (error) {
        console.error("Activate error:", error);
        res.status(500).json({ error: 'Failed to activate user' });
    }
});

router.get('/facility-levels', (req, res) => {
    try {
        const levels = db.prepare('SELECT * FROM facility_levels ORDER BY level DESC').all();
        res.json(levels);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch levels' });
    }
});

// Override facilities to join with levels
router.get('/facilities', (req, res) => {
  try {
    const facilities = db.prepare(`
        SELECT f.*, fl.name as level_name, fl.description as level_description, fl.level as level_number
        FROM facilities f
        LEFT JOIN facility_levels fl ON f.level_id = fl.id
        ORDER BY f.name
    `).all();
    // Transform to nested object if necessary, or just return flattened
    // Frontend expects nested facility_levels object:
    const result = facilities.map(f => ({
        ...f,
        facility_levels: {
            id: f.level_id,
            name: f.level_name,
            description: f.level_description,
            level: f.level_number
        }
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

// === Patients ===
router.get('/patients', (req, res) => {
  try {
    const patients = db.prepare(`
      SELECT p.id, p.email, p.full_name, p.phone, p.status, p.created_at, p.updated_at
      FROM profiles p
      JOIN user_roles ur ON p.id = ur.user_id
      WHERE ur.role = 'patient' AND p.status = 'active'
      ORDER BY p.full_name
    `).all();
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.post('/admin/codes', (req, res) => {
    const { code, role } = req.body;
    try {
        db.prepare("INSERT INTO registration_codes (id, code, role, is_active) VALUES (?, ?, ?, 1)").run(require('crypto').randomUUID(), code, role);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create code' });
    }
});


// === Notifications ===
router.get('/notifications', (req, res) => {
  try {
    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.put('/notifications/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

router.put('/notifications/read-all', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

router.post('/notifications', (req, res) => {
    const { title, message, recipient } = req.body;
    try {
        let targets = [];
        if (recipient === 'all') {
            targets = db.prepare("SELECT id FROM profiles WHERE status = 'active'").all().map(u => u.id);
        } else {
            targets = db.prepare("SELECT user_id FROM user_roles WHERE role = ?").all(recipient).map(u => u.user_id);
        }
        
        const stmt = db.prepare("INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, 'admin')");
        db.transaction(() => {
            targets.forEach(userId => {
                stmt.run(require('crypto').randomUUID(), userId, title, message);
            });
        })();
        
        res.json({ success: true });
    } catch (error) {
        console.error("Send notification error:", error);
        res.status(500).json({ error: 'Failed to send notifications' });
    }
});

// === FAQs ===
router.get('/faqs', (req, res) => {
  try {
    const faqs = db.prepare("SELECT * FROM faqs WHERE is_published = 1 ORDER BY order_index").all();
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// === Feedback ===
router.post('/feedback', (req, res) => {
  const { subject, message, category, recipient } = req.body;
  try {
    db.prepare(`
      INSERT INTO feedback (id, user_id, subject, message, category, recipient, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'pending')
    `).run(require('crypto').randomUUID(), req.user.id, subject, message, category, recipient);
    res.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// === Admin Security Stats ===
router.get('/admin/security-stats', (req, res) => {
  try {
     // 1. Failed Logins (last 24h)
     const failedLogins = db.prepare(`
        SELECT COUNT(*) as count FROM audit_logs 
        WHERE action = 'LOGIN_FAILED' 
        AND created_at > datetime('now', '-1 day')
     `).get().count;

     // 2. Active Sessions (Unique successful logins in last 24h) - Proxy for active sessions
     const activeSessions = db.prepare(`
        SELECT COUNT(DISTINCT user_id) as count FROM audit_logs 
        WHERE action = 'LOGIN_SUCCESS' 
        AND created_at > datetime('now', '-1 day')
     `).get().count;

     // 3. Recent Audit Logs
     const logs = db.prepare(`
        SELECT a.*, p.full_name, p.email 
        FROM audit_logs a
        LEFT JOIN profiles p ON a.user_id = p.id
        ORDER BY a.created_at DESC
        LIMIT 10
     `).all();

     // 4. Security Score (Mock calculation for now, or based on failures)
     // Base 100, minus 5 per failure in last 24h
     let securityScore = 100 - (failedLogins * 5);
     if (securityScore < 0) securityScore = 0;

     res.json({
         failedLogins,
         activeSessions,
         securityScore,
         logs
     });
  } catch (error) {
    console.error("Security stats error:", error);
    res.status(500).json({ error: 'Failed to fetch security stats' });
  }
});

// === Stats / Dashboard ===
router.get('/stats', (req, res) => {
  try {
    // Mock stats for dashboard
    const stats = {
      active_referrals: db.prepare("SELECT COUNT(*) as count FROM referrals WHERE status = 'in_progress'").get().count,
      pending_referrals: db.prepare("SELECT COUNT(*) as count FROM referrals WHERE status = 'pending'").get().count,
      completed_referrals: db.prepare("SELECT COUNT(*) as count FROM referrals WHERE status = 'completed'").get().count
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// === Consents ===
router.get('/consents', (req, res) => {
  try {
    const consents = db.prepare(`
      SELECT * FROM consents WHERE patient_id = ? ORDER BY created_at DESC
    `).all(req.user.id);
    res.json(consents);
  } catch (error) {
    console.error('Error fetching consents:', error);
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
});

router.post('/consents', (req, res) => {
  const { entity_type, entity_id, entity_name, status } = req.body;
  const { randomUUID } = require('crypto');
  
  try {
    // Check if consent already exists
    const existing = db.prepare(`
      SELECT id FROM consents 
      WHERE patient_id = ? AND entity_type = ? AND entity_id = ?
    `).get(req.user.id, entity_type, entity_id);

    if (existing) {
      db.prepare(`
        UPDATE consents 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(status, existing.id);
    } else {
      db.prepare(`
        INSERT INTO consents (id, patient_id, entity_type, entity_id, entity_name, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), req.user.id, entity_type, entity_id, entity_name, status);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating consent:', error);
    res.status(500).json({ error: 'Failed to update consent' });
  }
});

module.exports = router;
