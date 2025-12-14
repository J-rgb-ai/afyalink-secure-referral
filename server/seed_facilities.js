const db = require('./db');
const { randomUUID } = require('crypto');

async function seedFacilities() {
  console.log('Seeding facilities...');

  const levels = [
    { level: 6, name: 'Level 6', description: 'National Referral Hospital' },
    { level: 5, name: 'Level 5', description: 'County Referral Hospital' },
    { level: 4, name: 'Level 4', description: 'Sub-County Hospital' },
    { level: 3, name: 'Level 3', description: 'Health Centre' },
    { level: 2, name: 'Level 2', description: 'Dispensary' },
    { level: 1, name: 'Level 1', description: 'Community Unit' },
  ];

  const facilities = [
    // Level 6
    { name: 'Kenyatta National Hospital', level: 6, type: 'Public' },
    { name: 'Kenyatta University Teaching, Referral, and Research Hospital', level: 6, type: 'Public' },
    { name: 'Moi Teaching and Referral Hospital', level: 6, type: 'Public' },

    // Level 5
    { name: 'Nairobi Hospital', level: 5, type: 'Private' },
    { name: 'Coast General Hospital', level: 5, type: 'Public' },
    { name: 'Embu Level 5 Hospital', level: 5, type: 'Public' },
    { name: 'Nakuru Level 5 Hospital', level: 5, type: 'Public' },

    // Level 4
    { name: 'Mama Lucy Kibaki Hospital', level: 4, type: 'Public' },
    { name: "St. Mary's Mission Hospital, Nairobi", level: 4, type: 'Faith-based' },
    { name: 'Narok County Referral Hospital', level: 4, type: 'Public' },
    { name: 'Busia County Referral Hospital', level: 4, type: 'Public' },

    // Level 3
    { name: 'Jacaranda Maternity Clinic', level: 3, type: 'Private' },
    { name: 'NKUBU MEDICARE MEDICAL CENTRE', level: 3, type: 'Private' },
    { name: 'KIRINDINE MUTETHIA MATERNITY & NURSING HOME', level: 3, type: 'Private' },
    { name: '2 KEMU MEDICAL CENTRE', level: 3, type: 'Private' },

    // Level 2
    { name: 'MIKINDURI INTEGRATED RURAL MEDICAL CLINIC', level: 2, type: 'Public' },
    { name: '7 LEWA WILDLIFE CONSERVANCY MEDICAL CLINIC', level: 2, type: 'Private' },
    { name: 'MAKUTANO MEDICAL HEALTH CLINIC', level: 2, type: 'Public' },
    { name: 'LANS MEDICAL CLINIC', level: 2, type: 'Private' },

    // Level 1
    { name: 'Kosirai Community Unit', level: 1, type: 'Public' },
    { name: 'Kiaumbui Dispensary (Gichugu)', level: 1, type: 'Public' },
  ];

  db.transaction(() => {
    // 1. Clear existing facilities and levels to avoid duplicates or orphaned ids
    // BE CAREFUL: This deletes all existing facilities!
    db.prepare('DELETE FROM facilities').run();
    db.prepare('DELETE FROM facility_levels').run();
    
    // 2. Insert Levels
    const levelMap = new Map();
    for (const lvl of levels) {
       const id = randomUUID();
       db.prepare('INSERT INTO facility_levels (id, name, level, description) VALUES (?, ?, ?, ?)').run(id, lvl.name, lvl.level, lvl.description);
       levelMap.set(lvl.level, id);
    }
    console.log('Seeded facility levels.');

    // 3. Insert Facilities
    for (const f of facilities) {
        const id = randomUUID();
        const levelId = levelMap.get(f.level);
        db.prepare('INSERT INTO facilities (id, name, type, level_id, status, rating) VALUES (?, ?, ?, ?, ?, ?)').run(id, f.name, f.type, levelId, 'active', 5.0);
    }
    console.log(`Seeded ${facilities.length} facilities.`);

  })();

  console.log('Facility seeding complete.');
}

seedFacilities();
