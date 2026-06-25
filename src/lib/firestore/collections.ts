import { db } from '@/lib/firebase/client';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';

// Collection references
export const USERS_COLLECTION = 'users';
export const APPOINTMENTS_COLLECTION = 'appointments';
export const PRESCRIPTIONS_COLLECTION = 'prescriptions';
export const ORDERS_COLLECTION = 'orders';
export const MEDICINES_COLLECTION = 'medicines';
export const QUEUE_COLLECTION = 'queue';
export const STAFF_COLLECTION = 'staff';
export const SHIFTS_COLLECTION = 'shifts';
export const MESSAGES_COLLECTION = 'messages';

// Generic CRUD operations
export async function createDocument(collectionName: string, data: any, id?: string) {
  const docRef = id ? doc(db, collectionName, id) : doc(collection(db, collectionName));
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getDocument(collectionName: string, id: string) {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function updateDocument(collectionName: string, id: string, data: any) {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(collectionName: string, id: string) {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

export async function queryDocuments(collectionName: string, constraints: QueryConstraint[] = []) {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Real-time listener
export function listenToDocuments(collectionName: string, callback: (data: any[]) => void) {
  const q = collection(db, collectionName);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
}
