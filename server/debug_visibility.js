const db = require('./db');

console.log("--- Debugging Wycliff's Referral Visibility ---");

// 1. Find Wycliff
const wycliff = db.prepare("SELECT p.id, p.full_name, ms.facility_id, f.name as facility_name FROM profiles p JOIN medical_staff ms ON p.id = ms.user_id LEFT JOIN facilities f ON ms.facility_id = f.id WHERE p.full_name LIKE '%Wycliff%'").get();

if (!wycliff) {
    console.log("User 'Wycliff' not found.");
} else {
    console.log("User:", wycliff);

    // 2. Find Referral with Tuberculosis
    const referral = db.prepare("SELECT id, facility_from, facility_to, diagnosis, referring_doctor_id, assigned_doctor_id FROM referrals WHERE diagnosis LIKE '%Tubercolusis%' OR diagnosis LIKE '%Tuberculosis%'").get();

    if (!referral) {
        console.log("Referral with Tuberculosis not found.");
    } else {
        console.log("Referral:", referral);

        // 3. Check Visibility Logic
        // Logic: Visible if (referring_doctor_id == user.id) OR (assigned_doctor_id == user.id) OR (facility_to == user.facility_id AND assigned_doctor_id IS NULL)

        const isReferrer = referral.referring_doctor_id === wycliff.id;
        const isAssigned = referral.assigned_doctor_id === wycliff.id;
        const isFacilityMatch = referral.facility_to === wycliff.facility_id;
        const isUnassigned = referral.assigned_doctor_id === null;

        console.log("--- Visibility Check ---");
        console.log(`Is Referrer? ${isReferrer}`);
        console.log(`Is Assigned? ${isAssigned}`);
        console.log(`Is Target Facility Match? ${isFacilityMatch} (Referral To: ${referral.facility_to}, User Facility: ${wycliff.facility_id})`);
        console.log(`Is Unassigned? ${isUnassigned}`);

        if (isReferrer || isAssigned || (isFacilityMatch && isUnassigned)) {
            console.log("RESULT: Wycliff SHOULD see this referral.");
        } else {
            console.log("RESULT: Wycliff should NOT see this referral with current logic.");
        }
    }
}
