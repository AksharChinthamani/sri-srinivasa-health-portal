'use client';
import { useEffect, useRef } from 'react';

export default function VideoCall({ doctorId }: { doctorId: string }) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Placeholder for WebRTC integration
    // In real implementation, you'd use Daily.co or Twilio
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Simulate remote stream (placeholder)
      })
      .catch((err) => console.error('Camera error:', err));
  }, []);

  return (
    <div className="h-full w-full relative">
      {/* Remote video (main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover bg-gray-800"
      />
      {/* Local video (picture-in-picture) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute bottom-4 right-4 w-32 h-24 rounded-lg object-cover border-2 border-white"
      />
      <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded">
        {doctorId === 'd1' ? 'Dr. Anjali Sharma' : 'Doctor'}
      </div>
    </div>
  );
}
