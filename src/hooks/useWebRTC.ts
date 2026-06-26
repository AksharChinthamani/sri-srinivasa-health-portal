'use client';

/**
 * useWebRTC – Core hook for WebRTC peer-to-peer video/audio consultation
 * Migrated to use Firebase Firestore for signaling to support Serverless environments.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { db } from '@/lib/firebase/client';
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  runTransaction
} from 'firebase/firestore';

export type ConnectionState =
  | 'idle'
  | 'joining'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'error';

export interface WebRTCState {
  connectionState: ConnectionState;
  isMuted: boolean;
  isVideoOff: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  toggleMute: () => void;
  toggleVideo: () => void;
  hangup: () => void;
  error: string | null;
}

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  enabled?: boolean;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTC({ roomId, userId, enabled = false }: UseWebRTCOptions): WebRTCState {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const unsubscribesRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!enabled || !roomId || !userId) return;

    let isMounted = true;

    const init = async () => {
      try {
        setConnectionState('joining');

        // 1. Get optimized local media for seamless performance
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 24, max: 30 },
            facingMode: 'user'
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        if (!isMounted) { 
          stream.getTracks().forEach(t => t.stop()); 
          return; 
        }
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Create peer connection with pre-gathering optimization
        const pc = new RTCPeerConnection({ 
          iceServers: ICE_SERVERS,
          iceCandidatePoolSize: 10 // Speeds up connection time by gathering candidates early
        });
        peerRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          console.log('[WebRTC] Connection state:', state);
          if (state === 'connected') setConnectionState('connected');
          else if (state === 'disconnected') setConnectionState('disconnected');
          else if (state === 'failed') setConnectionState('failed');
          else if (state === 'connecting') setConnectionState('connecting');
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setConnectionState('connected');
          }
        };

        // 3. Join Room via Firestore
        const roomRef = doc(db, 'rooms', roomId);
        let role: 'host' | 'guest' = 'guest';

        await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) {
            role = 'host';
            transaction.set(roomRef, { hostId: userId, guestId: null });
          } else {
            const data = roomDoc.data();
            if (data.hostId === userId) {
              role = 'host';
            } else {
              role = 'guest';
              transaction.update(roomRef, { guestId: userId });
            }
          }
        });

        const callerCandidatesCollection = collection(roomRef, 'callerCandidates');
        const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');

        pc.onicecandidate = (event) => {
          if (!event.candidate) return;
          if (role === 'host') {
            addDoc(callerCandidatesCollection, event.candidate.toJSON()).catch(console.warn);
          } else {
            addDoc(calleeCandidatesCollection, event.candidate.toJSON()).catch(console.warn);
          }
        };

        if (role === 'host') {
          setConnectionState('waiting');

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await updateDoc(roomRef, { offer: { type: offer.type, sdp: offer.sdp } });

          const unsubRoom = onSnapshot(roomRef, async (snapshot) => {
            if (!isMounted) return;
            const data = snapshot.data();

            if (data?.ended) {
              setConnectionState('disconnected');
              return;
            }

            if (data?.answer && !pc.currentRemoteDescription) {
              const rtcSessionDescription = new RTCSessionDescription(data.answer);
              await pc.setRemoteDescription(rtcSessionDescription);
              setConnectionState('connecting');

              const unsubCallee = onSnapshot(calleeCandidatesCollection, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                  if (change.type === 'added') {
                    const data = change.doc.data();
                    pc.addIceCandidate(new RTCIceCandidate(data)).catch(console.warn);
                  }
                });
              });
              unsubscribesRef.current.push(unsubCallee);
            }
          });
          unsubscribesRef.current.push(unsubRoom);

        } else {
          setConnectionState('connecting');

          const unsubRoom = onSnapshot(roomRef, async (snapshot) => {
            if (!isMounted) return;
            const data = snapshot.data();

            if (data?.ended) {
              setConnectionState('disconnected');
              return;
            }

            if (data?.offer && !pc.currentRemoteDescription) {
              const offerDescription = new RTCSessionDescription(data.offer);
              await pc.setRemoteDescription(offerDescription);
              
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await updateDoc(roomRef, { answer: { type: answer.type, sdp: answer.sdp } });

              const unsubCaller = onSnapshot(callerCandidatesCollection, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                  if (change.type === 'added') {
                    const data = change.doc.data();
                    pc.addIceCandidate(new RTCIceCandidate(data)).catch(console.warn);
                  }
                });
              });
              unsubscribesRef.current.push(unsubCaller);
            }
          });
          unsubscribesRef.current.push(unsubRoom);
        }

      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'WebRTC error';
        console.error('[useWebRTC Firestore]', err);
        setError(msg);
        setConnectionState('error');
      }
    };

    init();

    return () => {
      isMounted = false;
      unsubscribesRef.current.forEach((unsub) => unsub());
      unsubscribesRef.current = [];
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [enabled, roomId, userId]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsVideoOff((prev) => !prev);
  }, []);

  const hangup = useCallback(() => {
    unsubscribesRef.current.forEach((unsub) => unsub());
    unsubscribesRef.current = [];
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setConnectionState('disconnected');

    const roomRef = doc(db, 'rooms', roomId);
    updateDoc(roomRef, { ended: true }).catch(() => {});
  }, [roomId]);

  return {
    connectionState,
    isMuted,
    isVideoOff,
    localVideoRef,
    remoteVideoRef,
    toggleMute,
    toggleVideo,
    hangup,
    error,
  };
}
