const db = require('./db');
const { randomUUID } = require('crypto');

try {
    console.log('--- Debugging Facility Assignment ---');

    // 1. Get a test user (doctor)
    const user = db.prepare("SELECT p.id, p.full_name, ur.role FROM profiles p JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'doctor' LIMIT 1").get();
    if (!user) {
        console.error('No doctor found in DB to test with.');
        process.exit(1);
    }
    console.log('Test User:', user);

    // 2. Get a test facility
    const facility = db.prepare("SELECT id, name FROM facilities LIMIT 1").get();
    if (!facility) {
        console.error('No facility found in DB.');
        process.exit(1);
    }
    console.log('Test Facility:', facility);

    // 3. Simulate Assignment Logic (Copy-Pasted from route)
    console.log('Attempting assignment...');
    const facilityId = facility.id;
    const role = user.role;
    const id = user.id;

    db.transaction(() => {
        // Upsert medical_staff record
        const existingStaff = db.prepare('SELECT id FROM medical_staff WHERE user_id = ?').get(id);

        if (existingStaff) {
            console.log('Updating existing staff record...');
            db.prepare(`
                    UPDATE medical_staff 
                    SET facility_id = ?, staff_type = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE user_id = ?
                 `).run(facilityId, role, id);
        } else {
            console.log('Inserting new staff record...');
            db.prepare(`
                    INSERT INTO medical_staff (id, user_id, facility_id, staff_type, status)
                    VALUES (?, ?, ?, ?, 'active')
                 `).run(randomUUID(), id, facilityId, role);
        }
    })();

    console.log('SUCCESS: Assignment completed without error.');

} catch (error) {
    console.error('FAILURE: Error during assignment:');
    console.error(error);
}
