import { db } from '@/lib/firebase/client';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

export interface CallSession {
  id: string;
  callerId: string;
  calleeId: string;
  status: 'waiting' | 'ringing' | 'connected' | 'ended';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  iceCandidates: Array<{
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
  }>;
  startTime?: string;
  endTime?: string;
}

export const CALLS_COLLECTION = 'calls';

// Create a new call session
export async function createCall(callerId: string, calleeId: string): Promise<string> {
  const callRef = doc(collection(db, CALLS_COLLECTION));
  await setDoc(callRef, {
    callerId,
    calleeId,
    status: 'waiting',
    iceCandidates: [],
    createdAt: serverTimestamp(),
  });
  return callRef.id;
}

// Get call session
export async function getCall(callId: string): Promise<CallSession | null> {
  const callRef = doc(db, CALLS_COLLECTION, callId);
  const docSnap = await getDoc(callRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as CallSession : null;
}

// Update call status
export async function updateCallStatus(callId: string, status: CallSession['status']) {
  const callRef = doc(db, CALLS_COLLECTION, callId);
  await updateDoc(callRef, { status });
}

// Add ICE candidate
export async function addIceCandidate(
  callId: string, 
  candidate: RTCIceCandidate,
  direction: 'caller' | 'callee'
) {
  const callRef = doc(db, CALLS_COLLECTION, callId);
  const call = await getCall(callId);
  if (!call) throw new Error('Call not found');
  
  const candidates = call.iceCandidates || [];
  candidates.push({
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
  });
  
  await updateDoc(callRef, { iceCandidates: candidates });
}

// Set offer/answer
export async function setOffer(callId: string, offer: RTCSessionDescriptionInit) {
  const callRef = doc(db, CALLS_COLLECTION, callId);
  await updateDoc(callRef, { offer });
}

export async function setAnswer(callId: string, answer: RTCSessionDescriptionInit) {
  const callRef = doc(db, CALLS_COLLECTION, callId);
  await updateDoc(callRef, { answer });
}

// Listen to call updates (real-time)
export function listenToCall(callId: string, callback: (data: CallSession) => void) {
  const callRef = doc(db, CALLS_COLLECTION, callId);
  return onSnapshot(callRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as CallSession);
    }
  });
}

// End call
export async function endCall(callId: string) {
  const callRef = doc(db, CALLS_COLLECTION, callId);
  await updateDoc(callRef, { 
    status: 'ended', 
    endTime: serverTimestamp() 
  });
}
