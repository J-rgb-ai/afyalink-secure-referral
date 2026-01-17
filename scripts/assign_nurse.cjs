const db = require('../server/db');

// Explicitly setting IDs for simulation based on request
// Ideally we would look them up by email, but for robustness in this specific scenario we'll try to find them.

try {
    console.log("Starting nurse assignment migration...");

    // 1. Find Vee Airo (Nurse)
    const nurse = db.prepare("SELECT id, full_name FROM profiles WHERE full_name LIKE '%Vee Airo%' OR email LIKE '%vee%'").get();
    if (!nurse) {
        console.error("Nurse 'Vee Airo' not found. Please ensure the user exists.");
        // Create if missing? Maybe better to fail and let user know.
        // For this task, let's look for ANY nurse if specific one missing, or create.
        // But user said "Vee Airo".
        process.exit(1);
    }
    console.log(`Found Nurse: ${nurse.full_name} (${nurse.id})`);

    // 2. Find Wire Good (Patient)
    // Adjust search to be loose or specific
    const patient = db.prepare("SELECT id, full_name FROM profiles WHERE full_name LIKE '%Wire Good%' OR email LIKE '%wire%'").get();
    if (!patient) {
         console.error("Patient 'Wire Good' not found.");
         process.exit(1);
    }
    console.log(`Found Patient: ${patient.full_name} (${patient.id})`);

    // 3. Update Referrals
    const result = db.prepare(`
        UPDATE referrals 
        SET assigned_nurse_id = ? 
        WHERE patient_id = ?
    `).run(nurse.id, patient.id);

    console.log(`Updated ${result.changes} referrals. Assigned to ${nurse.full_name}.`);
    
} catch (error) {
    console.error("Migration failed:", error);
}
