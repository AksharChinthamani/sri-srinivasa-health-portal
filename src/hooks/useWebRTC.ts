'use client';

/**
 * useWebRTC – Core hook for WebRTC peer-to-peer video/audio consultation
 *
 * Usage:
 *   const rtc = useWebRTC({ roomId, userId, isHost });
 *   <video ref={rtc.localVideoRef} autoPlay muted playsInline />
 *   <video ref={rtc.remoteVideoRef} autoPlay playsInline />
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
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
  enabled?: boolean; // only start when true (user clicks "Join")
}

// ──────────────────────────────────────────────────────────────
// STUN servers (Google's free public STUN)
// ──────────────────────────────────────────────────────────────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ──────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────
export function useWebRTC({ roomId, userId, enabled = false }: UseWebRTCOptions): WebRTCState {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const myPeerIdRef = useRef<string | null>(null);
  const remotePeerIdRef = useRef<string | null>(null);
  const isHostRef = useRef<boolean>(false);
  const sseRef = useRef<EventSource | null>(null);
  const signalIndexRef = useRef<number>(0);
  const cleanedUpRef = useRef(false);

  // ── Internal: send a signal to the other peer ──────────────
  const sendSignal = useCallback(
    async (type: 'offer' | 'answer' | 'ice-candidate', payload: unknown) => {
      if (!remotePeerIdRef.current || !myPeerIdRef.current) return;
      await fetch('/api/webrtc/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          type,
          payload,
          senderId: myPeerIdRef.current,
          targetId: remotePeerIdRef.current,
        }),
      });
    },
    [roomId],
  );

  // ── Internal: handle incoming signals ──────────────────────
  const handleSignal = useCallback(
    async (signal: { type: string; payload: unknown; senderId: string }) => {
      const pc = peerRef.current;
      if (!pc) return;

      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal('answer', answer);

      } else if (signal.type === 'answer') {
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
        }

      } else if (signal.type === 'ice-candidate') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.payload as RTCIceCandidateInit));
        } catch (e) {
          console.warn('[WebRTC] Failed to add ICE candidate', e);
        }
      }
    },
    [sendSignal],
  );

  // ── Internal: subscribe to SSE signals ────────────────────
  const subscribeSSE = useCallback(
    (peerId: string) => {
      const url = `/api/webrtc/signal?roomId=${roomId}&peerId=${encodeURIComponent(peerId)}&lastIndex=${signalIndexRef.current}`;
      const es = new EventSource(url);
      sseRef.current = es;

      es.onmessage = (event) => {
        try {
          const signal = JSON.parse(event.data);
          signalIndexRef.current += 1;
          handleSignal(signal);
        } catch (e) {
          console.error('[WebRTC SSE] Parse error', e);
        }
      };

      es.onerror = () => {
        // EventSource auto-reconnects — just log
        console.warn('[WebRTC SSE] Connection error, will retry…');
      };
    },
    [roomId, handleSignal],
  );

  // ── Internal: create the RTCPeerConnection ─────────────────
  const createPeerConnection = useCallback(
    (localStream: MediaStream): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add all local tracks
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      // Receive remote tracks
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Send ICE candidates to the other peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('ice-candidate', event.candidate.toJSON());
        }
      };

      // Track connection state
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

      return pc;
    },
    [sendSignal],
  );

  // ── Main effect: join room → get media → establish call ───
  useEffect(() => {
    if (!enabled || !roomId || !userId) return;

    cleanedUpRef.current = false;
    let isMounted = true;

    const init = async () => {
      try {
        setConnectionState('joining');

        // 1. Join the room – get our peerId and role
        const joinRes = await fetch('/api/webrtc/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, userId }),
        });
        if (!joinRes.ok) throw new Error('Failed to join room');
        const { peerId, role, existingPeerId } = await joinRes.json();

        if (!isMounted) return;
        myPeerIdRef.current = peerId;
        isHostRef.current = role === 'host';
        remotePeerIdRef.current = existingPeerId ?? null;

        // 2. Get local media (camera + mic)
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isMounted) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 3. Create peer connection
        const pc = createPeerConnection(stream);
        peerRef.current = pc;

        // 4. Subscribe to SSE signals
        subscribeSSE(peerId);

        if (existingPeerId) {
          // Remote peer already in room
          remotePeerIdRef.current = existingPeerId;

          if (role === 'host') {
            // Host creates the offer
            setConnectionState('connecting');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await sendSignal('offer', offer);
          }
          // Guest waits for the offer to arrive via SSE → handleSignal will answer
        } else {
          // We're first in the room — wait for the other peer
          setConnectionState('waiting');

          // Poll until a second peer joins, then create offer (if host)
          const pollForPeer = async () => {
            if (!isMounted || cleanedUpRef.current) return;
            const res = await fetch(`/api/webrtc/room?roomId=${roomId}`);
            const data = await res.json();
            const otherPeer = data.peers?.find((p: { peerId: string }) => p.peerId !== peerId);
            if (otherPeer) {
              remotePeerIdRef.current = otherPeer.peerId;
              if (isHostRef.current) {
                setConnectionState('connecting');
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await sendSignal('offer', offer);
              }
            } else {
              setTimeout(pollForPeer, 2000);
            }
          };
          pollForPeer();
        }

      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'WebRTC error';
        console.error('[useWebRTC]', err);
        setError(msg);
        setConnectionState('error');
      }
    };

    init();

    return () => {
      isMounted = false;
      cleanedUpRef.current = true;
      // Cleanup SSE
      sseRef.current?.close();
      sseRef.current = null;
      // Cleanup peer connection
      peerRef.current?.close();
      peerRef.current = null;
      // Stop local tracks
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomId, userId]);

  // ── Controls ───────────────────────────────────────────────
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
    sseRef.current?.close();
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (myPeerIdRef.current) {
      fetch(`/api/webrtc/room?roomId=${roomId}&peerId=${myPeerIdRef.current}`, { method: 'DELETE' }).catch(() => {});
    }
    setConnectionState('disconnected');
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
