'use client';

import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastContext } from '@/context/ToastContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MessageSquare,
  PhoneOff,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Send,
  Loader2,
  Wifi,
  WifiOff,
  Signal,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { LanguageContext } from '@/context/LanguageContext';
import { getTranslation } from '@/lib/i18n';

interface Medicine {
  id: string;
  name: string;
  category: string;
  stock: number;
}

// ──────────────────────────────────────────────────────────────
// Connection status badge
// ──────────────────────────────────────────────────────────────
function ConnectionBadge({ state }: { state: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    idle: { label: 'Idle', color: 'bg-slate-700 text-slate-400', icon: <Signal className="w-3 h-3" /> },
    joining: { label: 'Joining…', color: 'bg-blue-950 text-blue-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    waiting: { label: 'Waiting for peer…', color: 'bg-amber-950 text-amber-400', icon: <Users className="w-3 h-3 animate-pulse" /> },
    connecting: { label: 'Connecting…', color: 'bg-blue-950 text-blue-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    connected: { label: 'Live', color: 'bg-emerald-950 text-emerald-400', icon: <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> },
    disconnected: { label: 'Disconnected', color: 'bg-slate-700 text-slate-400', icon: <WifiOff className="w-3 h-3" /> },
    failed: { label: 'Connection Failed', color: 'bg-rose-950 text-rose-400', icon: <WifiOff className="w-3 h-3" /> },
    error: { label: 'Error', color: 'bg-rose-950 text-rose-400', icon: <AlertCircle className="w-3 h-3" /> },
  };
  const cfg = map[state] ?? map.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function VirtualConsultPage({ params }: { params: { id: string } }) {
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const router = useRouter();
  const { user } = useAuth();
  const toastContext = useContext(ToastContext);
  const queryClient = useQueryClient();

  // ── UI State ───────────────────────────────────────────────
  const [callActive, setCallActive] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [rightTab, setRightTab] = useState<'consultation' | 'chat'>('consultation');
  const [isPostConsult, setIsPostConsult] = useState(false);

  // ── Chat State ─────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Secure consultation room initialized.', time: 'Just now' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── SOAP / Prescription State ─────────────────────────────
  const [soapNote, setSoapNote] = useState<string | null>(null);
  const [prescribedMeds, setPrescribedMeds] = useState<any[]>([
    { medicineName: '', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days', instructions: 'After meals' },
  ]);
  const [rxNotes, setRxNotes] = useState('');

  // ── Data Fetching ─────────────────────────────────────────
  const { data: appointments = [], isLoading: isAppsLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () =>
      fetch('/api/appointments').then((res) => {
        if (!res.ok) throw new Error('Failed to fetch appointments');
        return res.json();
      }),
  });

  const { data: medicinesList = [] } = useQuery<Medicine[]>({
    queryKey: ['medicinesList'],
    queryFn: () =>
      fetch('/api/medicines').then((res) => {
        if (!res.ok) throw new Error('Failed to fetch medicines');
        return res.json();
      }),
  });

  const appointment = appointments.find((a: any) => a.id === params.id);
  const isDoctor = user?.role === 'DOCTOR';

  useEffect(() => {
    if (appointment?.notes && !soapNote) setSoapNote(appointment.notes);
  }, [appointment, soapNote]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── WebRTC ────────────────────────────────────────────────
  const rtc = useWebRTC({
    roomId: params.id,
    userId: user?.id ?? 'anonymous',
    enabled: callActive,
  });

  // Show toast on WebRTC error
  useEffect(() => {
    if (rtc.error) {
      toastContext?.addToast(`Camera/mic error: ${rtc.error}`, 'error');
    }
  }, [rtc.error, toastContext]);

  // ── Mutations ─────────────────────────────────────────────
  const endCallMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, status: 'COMPLETED' }),
      });
      if (!res.ok) throw new Error('Failed to update appointment status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toastContext?.addToast('Consultation completed successfully!', 'success');
      if (isDoctor) {
        setIsPostConsult(true);
      } else {
        router.push('/patient/dashboard');
      }
    },
    onError: (err: any) => {
      toastContext?.addToast(err.message || 'Error completing appointment', 'error');
    },
  });

  const generateSoapMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/soap-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: `Patient reports: Doctor, I have had a severe tension headache and fatigue for the last three days. It gets worse under stress. No fever.
Doctor: Okay, let me note down your vitals. Temperature is normal at 98.6F, and blood pressure is stable at 120/80. I will prescribe some rest, hydration, and Paracetamol for pain relief.`,
          patientInfo: {
            name: appointment?.patient?.user?.name || 'Patient',
            email: appointment?.patient?.user?.email,
            phone: appointment?.patient?.user?.phone,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to generate SOAP note');
      return res.json();
    },
    onSuccess: (data) => {
      setSoapNote(data.soapNote);
      toastContext?.addToast('AI SOAP Note generated successfully!', 'success');
    },
    onError: (err: any) => {
      toastContext?.addToast(err.message || 'Error generating notes', 'error');
    },
  });

  const saveSoapMutation = useMutation({
    mutationFn: async (notesText: string) => {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, status: appointment.status, notes: notesText }),
      });
      if (!res.ok) throw new Error('Failed to save notes');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toastContext?.addToast('Clinical notes saved to database!', 'success');
    },
    onError: (err: any) => {
      toastContext?.addToast(err.message || 'Error saving notes', 'error');
    },
  });

  const prescriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: appointment.patientId,
          notes: rxNotes,
          medicines: prescribedMeds.filter((m) => m.medicineName.trim() !== ''),
        }),
      });
      if (!res.ok) throw new Error('Failed to submit prescription');
      return res.json();
    },
    onSuccess: () => {
      toastContext?.addToast('E-Prescription issued and sent to pharmacy!', 'success');
      setPrescribedMeds([{ medicineName: '', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days', instructions: 'After meals' }]);
      setRxNotes('');
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
    onError: (err: any) => {
      toastContext?.addToast(err.message || 'Error submitting prescription', 'error');
    },
  });

  const { data: prescriptionsList = [] } = useQuery({
    queryKey: ['patientPrescriptions'],
    queryFn: () => fetch('/api/prescriptions').then((res) => res.json()),
    enabled: !!appointment && !isDoctor,
  });

  const currentPrescription = prescriptionsList.find(
    (p: any) =>
      p.patientId === appointment?.patientId &&
      p.doctorId === appointment?.doctorId &&
      new Date(p.issuedAt) >= new Date(Date.now() - 15 * 60 * 1000),
  );

  // ── Handlers ─────────────────────────────────────────────
  const handleStartCall = () => setCallActive(true);

  const handleEndCall = useCallback(() => {
    rtc.hangup();
    setShowEndModal(false);
    setCallActive(false);
    endCallMutation.mutate();
  }, [rtc, endCallMutation]);

  // End call automatically if the other peer hangs up
  useEffect(() => {
    if (rtc.connectionState === 'disconnected' && callActive) {
      toastContext?.addToast('The other participant has ended the call.', 'info');
      handleEndCall();
    }
  }, [rtc.connectionState, callActive, handleEndCall, toastContext]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages([
      ...chatMessages,
      { sender: user?.name || 'You', text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setNewMessage('');
  };

  const addMedicineField = () =>
    setPrescribedMeds([...prescribedMeds, { medicineName: '', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days', instructions: 'After meals' }]);

  const removeMedicineField = (index: number) =>
    setPrescribedMeds(prescribedMeds.filter((_, idx) => idx !== index));

  const handleMedicineChange = (index: number, field: string, value: string) => {
    const updated = [...prescribedMeds];
    updated[index][field] = value;
    setPrescribedMeds(updated);
  };

  // ── Loading / Not Found ───────────────────────────────────
  if (isAppsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <Loader2 className="w-10 h-10 animate-spin text-teal-500 mb-4" />
        <p className="text-lg font-medium">{getTranslation(language, 'auto.entering_secure_consultation_room')}</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-6">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{getTranslation(language, 'auto.consultation_room_not_found')}</h2>
        <p className="text-slate-400 max-w-md text-center mb-6">{getTranslation(language, 'auto.this_consultation_room_may_have_expired_')}</p>
        <Link href={isDoctor ? '/doctor/dashboard' : '/patient/dashboard'}>
          <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl font-bold transition">
            {getTranslation(language, 'auto.back_to_dashboard')}
          </button>
        </Link>
      </div>
    );
  }

  const remoteName = isDoctor ? appointment.patient?.user?.name || 'Patient' : appointment.doctor?.user?.name || 'Doctor';

  // ── Post Consultation View ──────────────────────────────
  if (isPostConsult) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 md:p-12 overflow-y-auto text-slate-200">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{getTranslation(language, 'auto.post_consultation_summary') || 'Post-Consultation Summary'}</h1>
              <p className="text-slate-400">{appointment.patient?.user?.name}</p>
            </div>
            <button 
              onClick={() => router.push('/doctor/dashboard')}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-2"
            >
              <span>{getTranslation(language, 'auto.finish_return_to_dashboard') || 'Finish & Return'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* AI SOAP Notes */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-950 text-teal-400 border border-teal-850">
                  {getTranslation(language, 'auto.ai_assisted')}
                </span>
              </div>
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">{getTranslation(language, 'auto.clinical_notes_soap')}</h3>
              {soapNote ? (
                <div className="space-y-3">
                  <textarea
                    value={soapNote}
                    onChange={(e) => setSoapNote(e.target.value)}
                    className="w-full h-40 bg-slate-900/80 p-3 rounded-lg text-xs font-mono text-teal-100 border border-slate-700 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                  />
                  <button
                    onClick={() => saveSoapMutation.mutate(soapNote)}
                    disabled={saveSoapMutation.isPending}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                  >
                    {saveSoapMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    {getTranslation(language, 'auto.save_notes_to_db')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => generateSoapMutation.mutate()}
                  disabled={generateSoapMutation.isPending}
                  className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white py-2 rounded-lg text-xs transition-colors flex justify-center items-center gap-2"
                >
                  {generateSoapMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-teal-400" /><span>{getTranslation(language, 'auto.analyzing_session_transcript')}</span></>
                  ) : (
                    <><FileText className="w-4 h-4 text-teal-400" /><span>{getTranslation(language, 'auto.generate_notes_from_transcript')}</span></>
                  )}
                </button>
              )}
            </div>

            {/* E-Prescription */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 space-y-4">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">{getTranslation(language, 'auto.write_e_prescription')}</h3>
              <div className="space-y-3">
                {prescribedMeds.map((med, index) => (
                  <div key={index} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2 relative">
                    {prescribedMeds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicineField(index)}
                        className="absolute top-2 right-2 text-rose-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">{getTranslation(language, 'auto.medicine_name')}</label>
                      <select
                        value={med.medicineName}
                        onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                        className="w-full bg-slate-800 px-2.5 py-1.5 rounded text-xs border border-slate-700 outline-none focus:border-teal-500"
                      >
                        <option value="">{getTranslation(language, 'auto.select_from_inventory')}</option>
                        {medicinesList.map((m) => (
                          <option key={m.id} value={m.name} disabled={m.stock <= 0}>
                            {m.name} ({m.category}) {m.stock <= 0 ? '[OUT OF STOCK]' : `[Stock: ${m.stock}]`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['dosage', 'frequency', 'duration'] as const).map((field) => (
                        <div key={field}>
                          <label className="text-[10px] text-slate-400 block mb-0.5 capitalize">{field}</label>
                          <input
                            type="text"
                            value={med[field]}
                            onChange={(e) => handleMedicineChange(index, field, e.target.value)}
                            className="w-full bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">{getTranslation(language, 'auto.special_instructions')}</label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                        className="w-full bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700 outline-none"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMedicineField}
                  className="w-full py-1.5 border border-dashed border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs flex justify-center items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> {getTranslation(language, 'auto.add_another_medicine')}
                </button>

                <div className="pt-2">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">{getTranslation(language, 'auto.prescription_remarks_notes')}</label>
                  <textarea
                    value={rxNotes}
                    onChange={(e) => setRxNotes(e.target.value)}
                    className="w-full h-16 bg-slate-900/60 p-2.5 rounded-lg text-xs border border-slate-700 outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <button
                  onClick={() => prescriptionMutation.mutate()}
                  disabled={prescriptionMutation.isPending || prescribedMeds.every((m) => m.medicineName.trim() === '')}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {prescriptionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {getTranslation(language, 'auto.submit_send_to_pharmacy')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row overflow-hidden font-sans text-slate-200">

      {/* ── Main Video Area ─────────────────────────────────── */}
      <div className="flex-1 relative flex flex-col p-4 md:p-6 transition-all duration-300">

        {/* Remote Video */}
        <div className="flex-1 bg-slate-900 rounded-2xl shadow-lg relative overflow-hidden flex items-center justify-center border border-slate-800 min-h-0">

          {/* Live remote stream */}
          <video
            ref={rtc.remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              rtc.connectionState === 'connected' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
            }`}
          />

          {/* Pre-connection placeholder */}
          {rtc.connectionState !== 'connected' && (
            <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center px-6 select-none">
              {!callActive ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-teal-900/40 border border-teal-700/50 flex items-center justify-center mb-2">
                    <Video className="w-10 h-10 text-teal-400" />
                  </div>
                  <p className="text-xl font-semibold text-slate-200">{getTranslation(language, 'auto.ready_to_start_your_consult')}</p>
                  <p className="text-sm text-slate-500 max-w-xs">
                    Your camera and microphone will be requested when you join. Both participants must join for the call to connect.
                  </p>
                  <button
                    id="start-call-btn"
                    onClick={handleStartCall}
                    className="mt-2 px-8 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-full font-semibold text-sm transition-all shadow-lg shadow-teal-900/30 hover:shadow-teal-900/60 flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    {getTranslation(language, 'auto.start_call')}
                  </button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl">
                      {isDoctor ? '🧑‍⚕️' : '👤'}
                    </div>
                    {rtc.connectionState === 'waiting' && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-slate-900 animate-pulse" />
                    )}
                    {(rtc.connectionState === 'connecting' || rtc.connectionState === 'joining') && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-slate-900 animate-pulse" />
                    )}
                  </div>
                  <p className="text-lg font-medium text-slate-200">{remoteName}</p>
                  <ConnectionBadge state={rtc.connectionState} />
                  {rtc.connectionState === 'waiting' && (
                    <p className="text-xs text-slate-500 mt-1">Share the appointment link with the other participant</p>
                  )}
                  {rtc.error && (
                    <div className="mt-2 px-4 py-2 bg-rose-950/50 border border-rose-800 rounded-lg text-xs text-rose-400 max-w-xs">
                      {rtc.error}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Remote peer name badge */}
          {callActive && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-medium z-10 flex items-center gap-2">
              <ConnectionBadge state={rtc.connectionState} />
              <span className="text-white">{remoteName}</span>
            </div>
          )}
        </div>

        {/* Self Video PiP */}
        {callActive && (
          <div className="absolute bottom-24 md:bottom-28 left-8 md:left-10 w-32 h-48 md:w-44 md:h-60 bg-slate-800 rounded-2xl shadow-xl overflow-hidden border-2 border-slate-700 z-10">
            <video
              ref={rtc.localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${rtc.isVideoOff ? 'hidden' : 'block'}`}
            />
            {rtc.isVideoOff && (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                <VideoOff className="w-8 h-8" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs font-medium">
              {getTranslation(language, 'auto.you')}
            </div>
            {rtc.isMuted && (
              <div className="absolute top-2 right-2 bg-rose-900/80 rounded-full p-0.5">
                <MicOff className="w-3 h-3 text-rose-400" />
              </div>
            )}
          </div>
        )}

        {/* Control Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full flex gap-3 border border-slate-800 shadow-2xl z-20">
          {callActive && (
            <>
              <button
                id="toggle-mute-btn"
                onClick={rtc.toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  rtc.isMuted ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={rtc.isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {rtc.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                id="toggle-video-btn"
                onClick={rtc.toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  rtc.isVideoOff ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={rtc.isVideoOff ? 'Start camera' : 'Stop camera'}
              >
                {rtc.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            </>
          )}

          <button
            id="toggle-chat-btn"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isChatOpen ? 'bg-teal-950 text-teal-400 border border-teal-800' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={getTranslation(language, 'auto.toggle_right_panel')}
          >
            <MessageSquare className="w-5 h-5" />
          </button>



          {callActive && (
            <>
              <div className="w-px h-8 bg-slate-800 my-auto mx-1" />
              <button
                id="end-call-btn"
                onClick={() => setShowEndModal(true)}
                className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-colors"
                title={getTranslation(language, 'auto.end_consultation_call')}
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Right Panel ─────────────────────────────────────── */}
      <div
        className={`bg-slate-900 w-full md:w-96 flex flex-col border-l border-slate-800 transition-all duration-300 ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full md:static md:translate-x-0 md:hidden'
        }`}
      >
        {/* Tabs */}
        <div className="flex border-b border-slate-800 p-4 pb-0">
          <button
            onClick={() => setRightTab('consultation')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-all ${
              rightTab === 'consultation' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {getTranslation(language, 'auto.consultation')}
          </button>
          <button
            onClick={() => setRightTab('chat')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-all ${
              rightTab === 'chat' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {getTranslation(language, 'auto.chat')} ({chatMessages.length})
          </button>
        </div>

        {rightTab === 'consultation' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Context/Role header */}
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800/80 flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isDoctor ? 'bg-teal-500' : 'bg-blue-500'}`} />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {isDoctor ? 'Doctor Workspace' : 'Patient Portal'}
              </p>
            </div>

            {isDoctor ? (
              /* ── DOCTOR SIDE ─────────────────────────────── */
              <>
                {/* Patient Info */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">{getTranslation(language, 'auto.patient_profile')}</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-400">{getTranslation(language, 'auto.name')}</span> <strong className="text-white">{appointment.patient?.user?.name}</strong></p>
                    <p><span className="text-slate-400">{getTranslation(language, 'auto.email')}</span> <span className="text-slate-300 text-xs">{appointment.patient?.user?.email}</span></p>
                    {appointment.patient?.user?.phone && (
                      <p><span className="text-slate-400">{getTranslation(language, 'auto.phone')}</span> <span className="text-slate-300 text-xs">{appointment.patient.user.phone}</span></p>
                    )}
                    <p><span className="text-slate-400">{getTranslation(language, 'auto.blood_group')}</span> <span className="text-slate-300 font-medium font-mono">{appointment.patient?.bloodGroup || 'Not specified'}</span></p>
                    {appointment.patient?.medicalHistory && (
                      <div className="mt-2.5 p-2 bg-slate-900/60 rounded border border-slate-800 text-xs text-slate-400">
                        <span className="font-bold text-slate-300 block mb-0.5">{getTranslation(language, 'auto.medical_history')}</span>
                        {appointment.patient.medicalHistory}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI SOAP Notes & E-Prescription have been moved to the Post Consultation View */}
              </>
            ) : (
              /* ── PATIENT SIDE ─────────────────────────────── */
              <>
                {/* Doctor Info */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">{getTranslation(language, 'auto.consulting_doctor')}</h3>
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-teal-950 text-teal-400 border border-teal-800 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0">
                      👨‍⚕️
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{appointment.doctor?.user?.name}</h4>
                      <p className="text-xs text-teal-400 font-semibold uppercase">{appointment.doctor?.specialty}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{appointment.doctor?.qualifications}</p>
                    </div>
                  </div>
                  <div className="mt-3.5 pt-3 border-t border-slate-700/50 text-xs text-slate-300 space-y-1">
                    <p><span className="text-slate-500">{getTranslation(language, 'auto.experience')}</span> {appointment.doctor?.experience} {getTranslation(language, 'auto.years')}</p>
                    <p><span className="text-slate-500">{getTranslation(language, 'auto.email')}</span> {appointment.doctor?.user?.email}</p>
                  </div>
                </div>

                {/* SOAP Notes for Patient */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">{getTranslation(language, 'auto.doctor_s_consultation_notes')}</h3>
                  {soapNote ? (
                    <div className="bg-slate-900/60 p-3.5 rounded-lg text-xs font-mono text-teal-100/90 whitespace-pre-wrap leading-relaxed border border-slate-800">
                      {soapNote}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-xs space-y-1">
                      <FileText className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                      <p>{getTranslation(language, 'auto.no_notes_written_yet')}</p>
                      <p className="text-[10px] text-slate-600">{getTranslation(language, 'auto.the_doctor_will_document_details_during_')}</p>
                    </div>
                  )}
                </div>

                {/* Live Prescription */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">{getTranslation(language, 'auto.issued_e_prescription')}</h3>
                  {currentPrescription ? (
                    <div className="p-3 bg-teal-950/30 rounded-lg border border-teal-900/50 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-teal-400 font-bold text-xs uppercase">
                        <CheckCircle2 className="w-4 h-4 text-teal-500" />
                        <span>{getTranslation(language, 'auto.prescription_issued')}</span>
                      </div>
                      <div className="divide-y divide-teal-950/60 text-xs">
                        {currentPrescription.medicines?.map((m: any, idx: number) => (
                          <div key={idx} className="py-2 first:pt-0 last:pb-0 text-slate-200">
                            <p className="font-bold text-white">{m.medicineName}</p>
                            <p className="text-slate-400 text-[10px]">{m.dosage} · {m.frequency} · {m.duration}</p>
                            {m.instructions && <p className="text-teal-400/80 text-[10px] italic">*{m.instructions}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-700 rounded-xl">
                      <p className="font-medium text-slate-400">{getTranslation(language, 'auto.waiting_for_prescription')}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{getTranslation(language, 'auto.once_issued_it_will_display_here_and_syn')}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── Chat Tab ─────────────────────────────────────── */
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {chatMessages.map((msg, idx) => {
                const isSystem = msg.sender === 'System';
                const isMe = msg.sender === (user?.name || 'You');
                return (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] ${isSystem ? 'mx-auto text-center' : isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    {!isSystem && (
                      <span className="text-[10px] text-slate-500 font-bold mb-0.5">{isMe ? 'You' : msg.sender}</span>
                    )}
                    <div
                      className={`p-3 rounded-2xl text-sm ${
                        isSystem
                          ? 'bg-slate-900 border border-slate-800 text-slate-500 text-xs py-1.5 px-3 rounded-lg'
                          : isMe
                          ? 'bg-teal-600 text-white rounded-br-none shadow'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {!isSystem && <span className="text-[9px] text-slate-600 font-medium mt-1">{msg.time}</span>}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={getTranslation(language, 'auto.type_your_message')}
                className="flex-1 bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-sm border border-slate-700 focus:border-teal-500 outline-none transition"
              />
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-xl font-bold transition flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── End Call Modal ───────────────────────────────────── */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-white mb-2">{getTranslation(language, 'auto.end_consultation_session')}</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              {getTranslation(language, 'auto.are_you_sure_you_want_to_end_this_virtua')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-colors border border-slate-700"
              >
                {getTranslation(language, 'auto.cancel')}
              </button>
              <button
                id="confirm-end-call-btn"
                onClick={handleEndCall}
                disabled={endCallMutation.isPending}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-bold transition-colors shadow flex items-center justify-center gap-1"
              >
                {endCallMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {getTranslation(language, 'auto.end_call')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
