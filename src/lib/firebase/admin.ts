import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let _adminAuth: any = null;
let _adminDb: any = null;

try {
  if (!getApps().length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    }
    
    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    if (clientEmail) {
      clientEmail = clientEmail.replace(/^["']|["']$/g, '');
    }

    let projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (projectId) {
      projectId = projectId.replace(/^["']|["']$/g, '');
    }

    if (privateKey) {
      initializeApp({
        credential: cert({
          projectId: projectId || 'dummy-project-id',
          clientEmail: clientEmail || 'dummy@dummy.iam.gserviceaccount.com',
          privateKey,
        }),
      });
    } else {
      console.warn('⚠️ FIREBASE_PRIVATE_KEY is missing. Firebase Admin SDK will not be initialized.');
    }
  }
  
  if (getApps().length > 0) {
    _adminAuth = getAuth();
    _adminDb = getFirestore();
  }
} catch (error) {
  console.log('Firebase admin initialization error:', error);
}

// Export mock proxies if initialization fails so it doesn't crash the server during module loading
export const adminAuth = _adminAuth || new Proxy({}, { get: () => () => { throw new Error('Firebase Admin not initialized: missing FIREBASE_PRIVATE_KEY') } });
export const adminDb = _adminDb || new Proxy({}, { get: () => () => { throw new Error('Firebase Admin not initialized: missing FIREBASE_PRIVATE_KEY') } });
