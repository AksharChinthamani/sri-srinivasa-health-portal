'use client';
import { useContext } from 'react';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isAfter } from 'date-fns';
import { Calendar, Clock, FileText, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';

export default function PatientAppointmentsPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [rescheduleAppId, setRescheduleAppId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean, appId: string, docName: string }>({ isOpen: false, appId: '', docName: '' });

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['patientAppointments'],
    queryFn: () => fetch('/api/appointments').then(res => {
      if (!res.ok) throw new Error('Failed to fetch appointments');
      return res.json();
    }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'CANCELLED' }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to cancel appointment');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientAppointments'] });
      setCancelModal({ isOpen: false, appId: '', docName: '' });
    },
  });

  const handleCancel = (id: string, docName: string) => {
    setCancelModal({ isOpen: true, appId: id, docName });
  };

  const rescheduleMutation = useMutation({
    mutationFn: (data: { id: string, date: string, time: string }) =>
      fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id, date: data.date, time: data.time, status: 'PENDING' }),
      }).then(async res => {
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.error || 'Failed to reschedule appointment');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientAppointments'] });
      setRescheduleAppId(null);
      setNewDate('');
      setNewTime('');
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const submitReschedule = () => {
    if (!newDate || !newTime) return alert('Please select a new date and time');
    if (rescheduleAppId) rescheduleMutation.mutate({ id: rescheduleAppId, date: newDate, time: newTime });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = appointments.filter((app: any) => {
    const appDate = new Date(app.date + 'T00:00:00');
    return app.status !== 'CANCELLED' && (isAfter(appDate, today) || app.status === 'PENDING' || app.status === 'CONFIRMED');
  });

  const pastAppointments = appointments.filter((app: any) => {
    const appDate = new Date(app.date + 'T00:00:00');
    return app.status === 'CANCELLED' || (!isAfter(appDate, today) && app.status !== 'PENDING' && app.status !== 'CONFIRMED');
  });

  const displayAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 font-bold py-1 px-3 rounded-full text-xs border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" /> {getTranslation(language, 'auto.confirmed')}</span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-bold py-1 px-3 rounded-full text-xs border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> {getTranslation(language, 'auto.pending_approval')}</span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 font-bold py-1 px-3 rounded-full text-xs border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> {getTranslation(language, 'auto.cancelled')}</span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 font-bold py-1 px-3 rounded-full text-xs border border-slate-200">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="space-y-4 pt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl border border-slate-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium">
        {getTranslation(language, 'auto.error_loading_appointments')}{(error as any).message}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{getTranslation(language, 'auto.my_appointments')}</h1>
        <p className="text-slate-500 text-sm mt-1">{getTranslation(language, 'auto.view_status_timings_and_manage_your_book')}</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 max-w-xs gap-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'upcoming'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {getTranslation(language, 'auto.upcoming')}{upcomingAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'past'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {getTranslation(language, 'auto.past_cancelled')}{pastAppointments.length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {displayAppointments.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{getTranslation(language, 'auto.no_appointments_found')}</h3>
            <p className="text-slate-500 text-sm mt-1">{getTranslation(language, 'auto.you_have_no')}{activeTab} {getTranslation(language, 'auto.appointments')}</p>
          </div>
        ) : (
          displayAppointments.map((app: any) => {
            const formattedDate = format(new Date(app.date + 'T00:00:00'), 'PPP');
            const docName = app.doctor?.user?.name || 'Unknown Doctor';
            const specialty = app.doctor?.specialty || 'General Practitioner';
            const isPendingOrConfirmed = app.status === 'PENDING' || app.status === 'CONFIRMED';

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center font-bold text-xl border border-teal-100 flex-shrink-0">
                    👨‍⚕️
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{docName}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{specialty}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{app.time}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${app.type === 'in-person' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {app.type === 'in-person' ? 'IN-PERSON' : 'VIRTUAL'}
                        </span>
                      </div>
                    </div>

                    {app.reason && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-lg">
                        <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                        <span className="line-clamp-2" title={app.reason}>
                          <strong>{getTranslation(language, 'auto.reason')}</strong> {app.reason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col justify-between items-end gap-3 shrink-0">
                  {getStatusBadge(app.status)}
                  {app.status === 'CONFIRMED' && app.type !== 'in-person' && (
                    <Link href={`/consult/${app.id}`} className="w-full md:w-auto">
                      <button className="w-full text-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                        {getTranslation(language, 'auto.join_consult')}</button>
                    </Link>
                  )}
                  {activeTab === 'upcoming' && isPendingOrConfirmed && rescheduleAppId !== app.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setRescheduleAppId(app.id);
                          setNewDate(app.date);
                          setNewTime(app.time);
                        }}
                        className="bg-white text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        {getTranslation(language, 'auto.postpone') || 'Postpone'}
                      </button>
                      <button
                        onClick={() => handleCancel(app.id, docName)}
                        className="bg-white text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        {getTranslation(language, 'auto.cancel_booking')}
                      </button>
                    </div>
                  )}

                  {rescheduleAppId === app.id && (
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
                        <button onClick={submitReschedule} disabled={rescheduleMutation.isPending} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm">Save</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, appId: '', docName: '' })}
        title="Cancel Appointment"
        description={`Are you sure you want to cancel your appointment with ${cancelModal.docName}?`}
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setCancelModal({ isOpen: false, appId: '', docName: '' })}>
            Keep Appointment
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => cancelMutation.mutate(cancelModal.appId)}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Canceling...' : 'Yes, Cancel'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
