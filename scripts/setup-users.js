const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

// Read .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    envVars[match[1]] = val;
  }
});

const privateKey = envVars.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

initializeApp({
  credential: cert({
    projectId: 'sri-srinivasa-health-portal',
    clientEmail: 'firebase-adminsdk-fbsvc@sri-srinivasa-health-portal.iam.gserviceaccount.com',
    privateKey: privateKey,
  }),
});

const auth = getAuth();
const db = getFirestore();

const createPredefinedUser = async (email, password, displayName, role) => {
  try {
    const user = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true
    });
    console.log(`Created user ${email} successfully in Firebase Auth!`);
    
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      name: displayName,
      email,
      role,
      updatedAt: new Date().toISOString()
    });
    console.log(`Saved user ${email} to Firestore database!`);
    
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      console.log(`User ${email} already exists. Updating password...`);
      const existingUser = await auth.getUserByEmail(email);
      await auth.updateUser(existingUser.uid, { password });
      await db.collection('users').doc(existingUser.uid).set({
        role,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`Updated password and role for ${email}!`);
    } else {
      console.error(`Error creating ${email}:`, err);
    }
  }
};

async function run() {
  console.log('Setting up predefined credentials...');
  await createPredefinedUser('adminsrinivas@gmail.com', 'srinivas143', 'Srinivas Admin', 'ADMIN');
  await createPredefinedUser('chemistsrinivas@gmail.com', 'chemistsrinivas143', 'Srinivas Chemist', 'PHARMACIST');
  console.log('Finished setting up predefined accounts!');
  process.exit(0);
}

run();
