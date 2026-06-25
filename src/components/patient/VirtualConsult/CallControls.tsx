'use client';
import { useState } from 'react';
import { Mic, MicOff, Camera, CameraOff, PhoneOff } from 'lucide-react';

export default function CallControls({ onEndCall }: { onEndCall: () => void }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
      <button
        onClick={() => setIsMuted(!isMuted)}
        className={`p-3 rounded-full transition ${
          isMuted ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'
        }`}
      >
        {isMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
      </button>
      <button
        onClick={() => setIsCameraOff(!isCameraOff)}
        className={`p-3 rounded-full transition ${
          isCameraOff ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'
        }`}
      >
        {isCameraOff ? <CameraOff size={20} className="text-white" /> : <Camera size={20} className="text-white" />}
      </button>
      <button
        onClick={onEndCall}
        className="p-3 bg-red-500 rounded-full hover:bg-red-600 transition"
      >
        <PhoneOff size={20} className="text-white" />
      </button>
    </div>
  );
}
