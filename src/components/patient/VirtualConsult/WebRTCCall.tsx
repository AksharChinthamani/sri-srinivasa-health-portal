'use client';
import { useEffect, useRef, useState } from 'react';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { 
  createCall, 
  listenToCall, 
  addIceCandidate, 
  setOffer, 
  setAnswer, 
  updateCallStatus,
  endCall 
} from '@/lib/firebase/call.service';

interface WebRTCCallProps {
  calleeId: string;
  onEndCall: () => void;
}

export function WebRTCCall({ calleeId, onEndCall }: WebRTCCallProps) {
  const { user } = useFirebaseAuth();
  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('connecting');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize call
  useEffect(() => {
    if (!user || !calleeId) return;

    const initCall = async () => {
      // Create call session
      const id = await createCall(user.uid, calleeId);
      setCallId(id);

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      peerConnectionRef.current = pc;

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addIceCandidate(id, event.candidate, 'caller');
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await setOffer(id, offer);
      await updateCallStatus(id, 'ringing');

      // Listen for call updates
      unsubscribeRef.current = listenToCall(id, async (data) => {
        setStatus(data.status);
        
        if (data.answer && pc.currentRemoteDescription?.type !== 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }

        // Handle incoming ICE candidates
        if (data.iceCandidates && data.iceCandidates.length > 0) {
          for (const candidate of data.iceCandidates) {
            if (candidate.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
        }
      });
    };

    initCall();

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [user, calleeId]);

  const handleEndCall = async () => {
    if (callId) {
      await endCall(callId);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      onEndCall();
    }
  };

  return (
    <div className="relative h-full w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />

      {/* Local Video (Picture-in-Picture) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute bottom-4 right-4 w-40 h-30 rounded-xl object-cover border-2 border-slate-700 shadow-lg"
      />

      {/* Status */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full uppercase tracking-wider">
        <span className="inline-block w-2 h-2 rounded-full bg-teal-500 mr-2 animate-pulse"></span>
        {status}
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
        <button
          onClick={handleEndCall}
          className="bg-red-500 text-white p-4 rounded-full shadow-xl hover:bg-red-600 hover:scale-105 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
