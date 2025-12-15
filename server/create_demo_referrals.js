const db = require('./db');
const { randomUUID } = require('crypto');

console.log('Seeding demo incoming referrals...');

// 1. Find Target Doctor (Recipient of referrals)
let targetDoctor = db.prepare("SELECT p.id, p.full_name, p.email FROM profiles p JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'doctor' AND p.email = 'john@gmail.com'").get();
if (!targetDoctor) {
    console.log("Doctor john@gmail.com not found. Creating one...");
    // Fallback if not found (though expected to exist)
    const newDocId = randomUUID();
    try {
         db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(newDocId, 'john@gmail.com', '$2a$10$YourHashHere');
         db.prepare("INSERT INTO profiles (id, email, full_name, status) VALUES (?, ?, ?, ?)").run(newDocId, 'john@gmail.com', 'Dr. John Doe', 'active');
         db.prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)").run(randomUUID(), newDocId, 'doctor');
         targetDoctor = { id: newDocId, full_name: 'Dr. John Doe', email: 'john@gmail.com' };
    } catch (e) { console.error(e); }
}

console.log(`Target Doctor (Incoming): ${targetDoctor.full_name} (${targetDoctor.email})`);

// 2. Find Sending Doctor
let sendingDoctor = db.prepare("SELECT p.id, p.full_name, p.email FROM profiles p JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'doctor' AND p.id != ? LIMIT 1").get(targetDoctor.id);

if (!sendingDoctor) {
    // Create fake sender
    const fakeId = randomUUID();
    try {
        db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(fakeId, 'sender@demo.com', 'hash');
        db.prepare("INSERT INTO profiles (id, email, full_name, status) VALUES (?, ?, ?, ?)").run(fakeId, 'sender@demo.com', 'Dr. Demo Sender', 'active');
        db.prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)").run(randomUUID(), fakeId, 'doctor');
    } catch(e) { /* ignore */ }
    sendingDoctor = { id: fakeId, full_name: 'Dr. Demo Sender' };
}

console.log(`Sending Doctor: ${sendingDoctor.full_name}`);

// 3. Find Patient "wire good"
let patient = db.prepare("SELECT p.id, p.full_name FROM profiles p JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'patient' AND p.full_name LIKE '%wire good%'").get();
if (!patient) {
     console.log("Patient 'wire good' not found. Using any patient.");
     patient = db.prepare("SELECT p.id, p.full_name FROM profiles p JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'patient' LIMIT 1").get();
}

console.log(`Patient: ${patient.full_name}`);

// 4. Create Referrals
const stmt = db.prepare(`
    INSERT INTO referrals (id, patient_id, referring_doctor_id, assigned_doctor_id, facility_from, facility_to, reason, urgency, status, diagnosis, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Referral 1
const id1 = randomUUID();
const r1 = {
    patient_id: patient.id,
    referring_doctor_id: sendingDoctor.id,
    assigned_doctor_id: targetDoctor.id,
    facility_from: "City General",
    facility_to: "John's Clinic",
    reason: "Severe back pain, requesting MRI analysis",
    urgency: "high",
    status: "pending",
    diagnosis: "Lumbar Strain",
    notes: "Patient reports pain lifting heavy objects."
};

stmt.run(id1, r1.patient_id, r1.referring_doctor_id, r1.assigned_doctor_id, r1.facility_from, r1.facility_to, r1.reason, r1.urgency, r1.status, r1.diagnosis, r1.notes);
console.log(`Created Referral 1: ${id1}`);

// Referral 2
const id2 = randomUUID();
const r2 = {
    patient_id: patient.id,
    referring_doctor_id: sendingDoctor.id,
    assigned_doctor_id: targetDoctor.id,
    facility_from: "Community Health Center",
    facility_to: "John's Clinic",
    reason: "Follow-up on blood pressure medication",
    urgency: "medium",
    status: "pending",
    diagnosis: "Hypertension",
    notes: "BP 150/95 at last visit."
};

stmt.run(id2, r2.patient_id, r2.referring_doctor_id, r2.assigned_doctor_id, r2.facility_from, r2.facility_to, r2.reason, r2.urgency, r2.status, r2.diagnosis, r2.notes);
console.log(`Created Referral 2: ${id2}`);

console.log("Done.");
