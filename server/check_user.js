const db = require('./db');
const name = 'Miriam'; // Corrected name

console.log(`Searching for user like '${name}'...`);
const user = db.prepare("SELECT * FROM profiles WHERE full_name LIKE ?").get(`%${name}%`);

if (!user) {
    console.log('User not found.');
} else {
    console.log('User:', user);
    const roles = db.prepare("SELECT * FROM user_roles WHERE user_id = ?").all(user.id);
    console.log('Roles:', roles);

    const staff = db.prepare("SELECT * FROM medical_staff WHERE user_id = ?").get(user.id);
    console.log('Medical Staff Record:', staff);
}
