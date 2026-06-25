'use client';

import { useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { LanguageContext } from '@/context/LanguageContext';
import { getTranslation } from '@/lib/i18n';

export default function AdminAppointmentsPage() {
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const queryClient = useQueryClient();
  const [rescheduleAppId, setRescheduleAppId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const { data: appointments = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['adminAppointments'],
    queryFn: async () => {
      const res = await fetch('/api/appointments');
      if (!res.ok) throw new Error('Failed to fetch appointments');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, date, time }: { id: string; status: string; date?: string; time?: string }) =>
      fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, date, time }),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to update status');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAppointments'] });
      setRescheduleAppId(null);
      setNewDate('');
      setNewTime('');
    },
  });

  const submitReschedule = () => {
    if (!newDate || !newTime) return alert('Please select a new date and time');
    if (rescheduleAppId) {
      updateStatusMutation.mutate({ id: rescheduleAppId, status: 'PENDING', date: newDate, time: newTime });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 font-medium">
        {getTranslation(language, 'auto.error_loading_appointments')} {(error as any).message}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{getTranslation(language, 'auto.appointments')}</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 pl-6">{getTranslation(language, 'auto.patient')}</th>
                <th className="p-4">{getTranslation(language, 'auto.doctor')}</th>
                <th className="p-4">{getTranslation(language, 'auto.date_time')}</th>
                <th className="p-4">{getTranslation(language, 'auto.reason')}</th>
                <th className="p-4">{getTranslation(language, 'auto.status')}</th>
                <th className="p-4 pr-6 text-right">{getTranslation(language, 'auto.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    {getTranslation(language, 'auto.no_appointments_booked_yet')}
                  </td>
                </tr>
              ) : (
                appointments.map((app: any) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {app.patient?.user?.name || 'Unknown'}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${app.type === 'in-person' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {app.type === 'in-person' ? 'IN-PERSON' : 'VIRTUAL'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{app.patient?.user?.email || app.patient?.user?.phone}</div>
                    </td>
                    <td className="p-4 text-slate-800 font-medium">{app.doctor?.user?.name || 'Unknown'}</td>
                    <td className="p-4 text-slate-600">
                      <div>{format(new Date(app.date), 'PPP')}</div>
                      <div className="text-xs text-teal-600 font-bold font-mono">{app.time}</div>
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate" title={app.reason}>
                      {app.reason || '—'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      {rescheduleAppId === app.id ? (
                        <div className="flex flex-col items-end gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
                          <div className="flex gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Date</label>
                              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="text-sm p-1 border rounded-lg w-full" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Time</label>
                              <select value={newTime} onChange={e => setNewTime(e.target.value)} className="text-sm p-1 border rounded-lg bg-white w-full">
                                <option value="">Select</option>
                                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full mt-2">
                            <button onClick={() => setRescheduleAppId(null)} className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300 px-2 py-1 rounded text-xs font-bold transition-all">Cancel</button>
                            <button onClick={submitReschedule} disabled={updateStatusMutation.isPending} className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 px-2 py-1 rounded text-xs font-bold transition-all shadow-sm">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {app.status === 'PENDING' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'CONFIRMED' })}
                              className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                            >
                              {getTranslation(language, 'auto.confirm')}
                            </button>
                          )}
                          {app.status !== 'CANCELLED' && (
                            <>
                              <button
                                onClick={() => { setRescheduleAppId(app.id); setNewDate(app.date); setNewTime(app.time); }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                              >
                                Postpone
                              </button>
                              <button
                                onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'CANCELLED' })}
                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                              >
                                {getTranslation(language, 'auto.cancel')}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
