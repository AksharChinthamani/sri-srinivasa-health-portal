'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Stethoscope, Calendar, Clock, Check, X, Video, User, Mail, Phone, FileText } from 'lucide-react';
import { useContext, useState } from 'react';
import { ToastContext } from '@/context/ToastContext';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import PrescriptionUploadModal from '@/components/doctor/PrescriptionUploadModal';

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  reason: string;
  type?: string;
  notes: string | null;
  patient: {
    bloodGroup: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
  };
}

async function fetchAppointments() {
  const res = await fetch('/api/appointments');
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return res.json() as Promise<Appointment[]>;
}

export default function DoctorDashboard() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toastContext = useContext(ToastContext);
  const router = useRouter();

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['doctorAppointments'],
    queryFn: fetchAppointments,
  });

  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleAppId, setRescheduleAppId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const openPrescriptionModal = (app: Appointment) => {
    setSelectedAppointment(app);
    setPrescriptionModalOpen(true);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, date, time }: { id: string; status: string; date?: string; time?: string }) => {
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, date, time }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
      toastContext?.addToast(`Appointment status updated to ${variables.status}`, 'success');
    },
    onError: (err: any) => {
      toastContext?.addToast(err.message || 'Error updating status', 'error');
    },
  });

  const handleStatusUpdate = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleStartCall = async (appId: string) => {
    await updateStatusMutation.mutateAsync({ id: appId, status: 'IN_PROGRESS' });
    router.push(`/consult/${appId}`);
  };

  const submitReschedule = () => {
    if (!newDate || !newTime) return alert('Please select a new date and time');
    if (rescheduleAppId) {
      updateStatusMutation.mutate({ id: rescheduleAppId, status: 'PENDING', date: newDate, time: newTime });
      setRescheduleAppId(null);
      setNewDate('');
      setNewTime('');
    }
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'PENDING').length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
  };

  const activeAppointments = appointments.filter(app => app.status === 'PENDING' || app.status === 'CONFIRMED');

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse p-6">
        <div className="h-10 bg-slate-200 rounded w-1/3 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">
            {greeting}, <span className="text-teal-700">{user?.name || 'Doctor'}</span> 🩺
          </h1>
          <p className="text-slate-500">{getTranslation(language, 'auto.manage_patient_consultations_and_clinic_')}</p>
        </div>
        <div className="bg-teal-50 text-teal-700 p-3 rounded-2xl border border-teal-100 hidden sm:block">
          <Stethoscope size={28} />
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{getTranslation(language, 'auto.total_scheduled')}</div>
          <div className="text-4xl font-extrabold text-slate-800 mt-2">{stats.total}</div>
        </div>
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="text-amber-500 text-sm font-semibold uppercase tracking-wider">{getTranslation(language, 'auto.pending_confirmation')}</div>
          <div className="text-4xl font-extrabold text-slate-800 mt-2">{stats.pending}</div>
        </div>
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="text-teal-600 text-sm font-semibold uppercase tracking-wider">{getTranslation(language, 'auto.confirmed_today')}</div>
          <div className="text-4xl font-extrabold text-slate-800 mt-2">{stats.confirmed}</div>
        </div>
      </div>

      {/* Appointments List */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{getTranslation(language, 'auto.clinic_appointments')}</h2>
            <p className="text-slate-500 text-xs mt-1">{getTranslation(language, 'auto.review_pending_booking_requests_and_acce')}</p>
          </div>
          <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-bold">
            {activeAppointments.length} Active {getTranslation(language, 'auto.appointments')}</span>
        </div>

        {activeAppointments.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Calendar size={48} className="mx-auto text-slate-300" />
            <p className="font-semibold text-slate-500">{getTranslation(language, 'auto.no_appointments_scheduled')}</p>
            <p className="text-sm">{getTranslation(language, 'auto.when_patients_book_appointments_they_wil')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeAppointments.map((app) => (
              <div key={app.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50/30 transition">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold shrink-0 border border-slate-200">
                    <User size={20} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 truncate">{app.patient.user.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        app.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        app.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {app.status}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${app.type === 'in-person' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {app.type === 'in-person' ? 'IN-PERSON' : 'VIRTUAL'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1"><Mail size={12} /> {app.patient.user.email}</span>
                      {app.patient.user.phone && <span className="flex items-center gap-1"><Phone size={12} /> {app.patient.user.phone}</span>}
                    </div>
                    {app.reason && (
                      <p className="text-sm text-slate-600 mt-1 font-medium bg-slate-100/50 p-2 rounded-lg border border-slate-200/50">
                        <span className="text-slate-400 font-bold text-xs uppercase mr-1.5">{getTranslation(language, 'auto.reason')}</span>
                        {app.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3 w-full md:w-auto shrink-0">
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 text-xs text-slate-700 font-semibold shadow-sm">
                    <span className="flex items-center gap-1 text-slate-500"><Calendar size={13} /> {format(new Date(app.date), 'dd MMM yyyy')}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="flex items-center gap-1 text-slate-500"><Clock size={13} /> {app.time}</span>
                  </div>

                  {rescheduleAppId === app.id ? (
                    <div className="flex flex-col sm:flex-row items-end gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Date</label>
                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="text-sm p-1.5 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Time</label>
                        <select value={newTime} onChange={e => setNewTime(e.target.value)} className="text-sm p-1.5 border rounded-lg bg-white">
                          <option value="">Select Time</option>
                          {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button onClick={() => setRescheduleAppId(null)} className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Cancel</button>
                        <button onClick={submitReschedule} disabled={updateStatusMutation.isPending} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {app.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'CONFIRMED')}
                            className="flex-1 sm:flex-initial p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                            title={getTranslation(language, 'auto.confirm_appointment')}
                          >
                            <Check size={14} /> {getTranslation(language, 'auto.confirm')}</button>
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'CANCELLED')}
                            className="flex-1 sm:flex-initial p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                            title={getTranslation(language, 'auto.cancel_appointment')}
                          >
                            <X size={14} /> {getTranslation(language, 'auto.decline')}</button>
                        </>
                      )}
                      {app.status === 'CONFIRMED' && (
                        <>
                          {app.type !== 'in-person' && (
                            <div className="flex-1 sm:flex-initial">
                              <button
                                onClick={() => handleStartCall(app.id)}
                                disabled={updateStatusMutation.isPending}
                                className="w-full p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                                title={getTranslation(language, 'auto.start_consultation')}
                              >
                                <Video size={14} /> {getTranslation(language, 'auto.start_call')}
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => openPrescriptionModal(app)}
                            className="flex-1 sm:flex-initial p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                            title="Write Prescription"
                          >
                            <FileText size={14} /> Prescribe
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'CANCELLED')}
                            className="p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-xl font-bold text-xs flex items-center justify-center transition"
                            title={getTranslation(language, 'auto.cancel_call')}
                          >
                            <X size={14} /> {getTranslation(language, 'auto.cancel')}</button>
                        </>
                      )}
                      {(app.status === 'PENDING' || app.status === 'CONFIRMED') && (
                        <button
                          onClick={() => { setRescheduleAppId(app.id); setNewDate(app.date); setNewTime(app.time); }}
                          className="flex-1 sm:flex-initial p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          title="Postpone"
                        >
                          <Calendar size={14} /> Postpone
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Prescription Modal */}
      {selectedAppointment && (
        <PrescriptionUploadModal
          isOpen={prescriptionModalOpen}
          onClose={() => {
            setPrescriptionModalOpen(false);
            setSelectedAppointment(null);
          }}
          patientId={selectedAppointment.patient.user.id}
          patientName={selectedAppointment.patient.user.name}
          appointmentId={selectedAppointment.id}
        />
      )}
    </div>
  );
}
