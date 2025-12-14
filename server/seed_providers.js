const db = require('./db');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

async function seedProviders() {
  console.log('Seeding healthcare providers...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const providers = [
    // Doctors
    { name: "Dr. Jane Kamau", email: "jane.kamau@kenyatta.hospital", role: "doctor", facility: "Kenyatta National Hospital", status: "active" },
    { name: "Dr. John Mwangi", email: "j.mwangi@nairobi.hospital", role: "doctor", facility: "Nairobi Hospital", status: "active" },
    { name: "Dr. Grace Njeri", email: "g.njeri@moi.hospital", role: "doctor", facility: "Moi Teaching and Referral Hospital", status: "active" },
    
    // Nurses
    { name: "Nurse Sarah Wanjiru", email: "s.wanjiru@coast.hospital", role: "nurse", facility: "Coast General Hospital", status: "active" },
    { name: "Nurse Mary Otieno", email: "m.otieno@embu.hospital", role: "nurse", facility: "Embu Level 5 Hospital", status: "active" },
    { name: "Nurse David Kipchoge", email: "d.kipchoge@nakuru.hospital", role: "nurse", facility: "Nakuru Level 5 Hospital", status: "suspended" }, // Suspended per mock data
    
    // Pharmacists
    { name: "Pharm. Michael Ouma", email: "m.ouma@kenyatta.pharmacy", role: "pharmacist", facility: "Kenyatta National Hospital", status: "active" },
    { name: "Pharm. Lucy Muthoni", email: "l.muthoni@nairobi.pharmacy", role: "pharmacist", facility: "Nairobi Hospital", status: "active" },
    { name: "Pharm. Joseph Kariuki", email: "j.kariuki@coast.pharmacy", role: "pharmacist", facility: "Coast General Hospital", status: "suspended" }, // Suspended
    
    // Lab Techs
    { name: "Lab Tech. Susan Achieng", email: "s.achieng@kenyatta.lab", role: "lab_technician", facility: "Kenyatta National Hospital", status: "active" },
    { name: "Lab Tech. Brian Kimani", email: "b.kimani@moi.lab", role: "lab_technician", facility: "Moi Teaching and Referral Hospital", status: "active" },
    { name: "Lab Tech. Faith Njoki", email: "f.njoki@embu.lab", role: "lab_technician", facility: "Embu Level 5 Hospital", status: "active" },
  ];

  db.transaction(() => {
    for (const p of providers) {
       // 1. Get Facility ID
       const facility = db.prepare('SELECT id FROM facilities WHERE name = ?').get(p.facility);
       if (!facility) {
           console.log(`Warning: Facility '${p.facility}' not found for user ${p.name}. Skipping facility link.`);
       }

       // 2. Check if user exists
       let existingIds = db.prepare('SELECT id FROM users WHERE email = ?').get(p.email);
       let userId;
       
       if (existingIds) {
           userId = existingIds.id;
           console.log(`User ${p.email} already exists. Updating...`);
           // Update profile just in case
           db.prepare('UPDATE profiles SET full_name = ?, status = ? WHERE id = ?').run(p.name, p.status, userId);
       } else {
           userId = randomUUID();
           db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(userId, p.email, passwordHash);
           db.prepare('INSERT INTO profiles (id, email, full_name, status) VALUES (?, ?, ?, ?)').run(userId, p.email, p.name, p.status);
       }

       // 3. Assign Role (check if exists first)
       const existingRole = db.prepare('SELECT 1 FROM user_roles WHERE user_id = ? AND role = ?').get(userId, p.role);
       if (!existingRole) {
           db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)').run(randomUUID(), userId, p.role);
       }

       // 4. Link to Medical Staff (Facility)
       if (facility) {
           // Check if entry exists in medical_staff
           // Note: medical_staff table (id, user_id, facility_id, staff_type, ...)
           // We'll treat role as staff_type
           const existingStaff = db.prepare('SELECT id FROM medical_staff WHERE user_id = ?').get(userId);
           if (existingStaff) {
                db.prepare('UPDATE medical_staff SET facility_id = ?, staff_type = ?, status = ? WHERE user_id = ?')
                  .run(facility.id, p.role, p.status, userId);
           } else {
                db.prepare('INSERT INTO medical_staff (id, user_id, facility_id, staff_type, status) VALUES (?, ?, ?, ?, ?)')
                  .run(randomUUID(), userId, facility.id, p.role, p.status);
           }
       }
    }
  })();

  console.log(`Seeded ${providers.length} providers.`);
}

seedProviders();
