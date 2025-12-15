const db = require('./db');

console.log('Adding rejection_reason column to referrals table...');

try {
    db.prepare("ALTER TABLE referrals ADD COLUMN rejection_reason TEXT").run();
    console.log("Column 'rejection_reason' added successfully.");
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log("Column 'rejection_reason' already exists.");
    } else {
        console.error("Error adding column:", error);
    }
}
