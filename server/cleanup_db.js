const db = require('./db');

async function cleanup() {
  const adminEmail = 'vanessakrystal231@gmail.com'; 
  console.log(`Cleaning profiles/users, preserving admin: ${adminEmail}...`);

  try {
    const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    
    if (!adminUser) {
        console.error('Admin user not found! Aborting cleanup.');
        return;
    }

    const adminId = adminUser.id;

    db.transaction(() => {
        // DELETE dependent data first to avoid logical errors in app (orphans)
        // Referrals involved with non-admin users
        db.prepare(`
            DELETE FROM referrals 
            WHERE patient_id != ? 
               OR referring_doctor_id != ? 
               OR assigned_doctor_id != ? 
               OR assigned_nurse_id != ?
        `).run(adminId, adminId, adminId, adminId);
        
        db.prepare('DELETE FROM feedback WHERE user_id != ?').run(adminId);
        db.prepare('DELETE FROM notifications WHERE user_id != ?').run(adminId);
        db.prepare('DELETE FROM medical_staff WHERE user_id != ?').run(adminId);
        
        // NOW delete the users/profiles/roles
        db.prepare('DELETE FROM user_roles WHERE user_id != ?').run(adminId);
        db.prepare('DELETE FROM profiles WHERE id != ?').run(adminId);
        db.prepare('DELETE FROM users WHERE id != ?').run(adminId);
        
    })();
    
    console.log('User cleanup complete. Facilities, Codes, and FAQs preserved.');
    
  } catch (error) {
      console.error('Error during cleanup:', error);
  }
}

cleanup();
