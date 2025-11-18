/**
 * Script to import allowed users from a CSV file
 * 
 * CSV Format:
 * email,name,role
 * student@example.com,John Doe,student
 * teacher@example.com,Jane Smith,teacher
 * 
 * Usage:
 * 1. Export your Excel sheet to CSV format
 * 2. Place it in the project root as 'allowed-users.csv'
 * 3. Run: node scripts/import-users.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importUsers() {
  const csvPath = path.join(__dirname, '..', 'allowed-users.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: allowed-users.csv not found in project root');
    console.log('📝 Please create allowed-users.csv with the following format:');
    console.log('email,name,role');
    console.log('student@example.com,John Doe,student');
    console.log('teacher@example.com,Jane Smith,teacher');
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    console.error('❌ Error: CSV file must have at least a header row and one data row');
    process.exit(1);
  }

  // Parse CSV line handling quoted fields
  function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add the last value
    return values;
  }

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const emailIndex = headers.indexOf('email');
  const nameIndex = headers.indexOf('name');
  const roleIndex = headers.indexOf('role');

  if (emailIndex === -1) {
    console.error('❌ Error: CSV must have an "email" column');
    process.exit(1);
  }

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  console.log('📤 Starting import...\n');

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < emailIndex + 1) {
      console.log(`⚠️  Skipping line ${i + 1}: Invalid format`);
      skipped++;
      continue;
    }

    // Remove quotes from values if present
    const email = values[emailIndex].replace(/^"|"$/g, '').toLowerCase().trim();
    const name = nameIndex !== -1 ? values[nameIndex].replace(/^"|"$/g, '').trim() : '';
    const role = roleIndex !== -1 ? values[roleIndex].replace(/^"|"$/g, '').trim() : 'student';

    if (!email || !email.includes('@')) {
      console.log(`⚠️  Skipping line ${i + 1}: Invalid email "${email}"`);
      skipped++;
      continue;
    }

    try {
      // Check if already exists
      const q = query(collection(db, 'allowedUsers'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log(`⏭️  Skipping ${email}: Already exists`);
        skipped++;
        continue;
      }

      // Add to Firestore
      await addDoc(collection(db, 'allowedUsers'), {
        email,
        name,
        role: role.toLowerCase(),
        createdAt: Timestamp.now()
      });

      console.log(`✅ Imported: ${email} (${name || 'No name'}, ${role})`);
      imported++;
    } catch (error) {
      console.error(`❌ Error importing ${email}:`, error.message);
      errors++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📝 Total processed: ${imported + skipped + errors}`);
}

importUsers()
  .then(() => {
    console.log('\n✨ Import completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

