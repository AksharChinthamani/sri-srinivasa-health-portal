import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ManageAppointmentModal({
  isOpen,
  onClose,
  appointmentId,
}: {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'options' | 'postpone' | 'cancel'>('options');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['patientAppointments'] });
      onClose();
    },
    onError: (err: any) => {
      alert(err.message || 'Error updating appointment');
    },
  });

  const handlePostpone = () => {
    if (!newDate || !newTime) return alert('Please select a new date and time');
    updateStatusMutation.mutate({ id: appointmentId, status: 'PENDING', date: newDate, time: newTime });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Manage Appointment</h3>
        
        {mode === 'options' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('postpone')}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Postpone (Reschedule)
            </button>
            <button
              onClick={() => setMode('cancel')}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Cancel Appointment
            </button>
            <button
              onClick={onClose}
              className="w-full text-slate-500 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {mode === 'cancel' && (
          <div className="space-y-4">
            <p className="text-slate-600 font-medium">Are you sure you want to cancel this appointment? This action cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setMode('options')}
                className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-xl font-bold transition-all"
              >
                No, Keep It
              </button>
              <button
                onClick={() => updateStatusMutation.mutate({ id: appointmentId, status: 'CANCELLED' })}
                disabled={updateStatusMutation.isPending}
                className="flex-1 bg-rose-600 text-white hover:bg-rose-700 px-4 py-2.5 rounded-xl font-bold transition-all flex justify-center items-center"
              >
                {updateStatusMutation.isPending ? 'Canceling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        )}

        {mode === 'postpone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Date</label>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2.5 border rounded-xl text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Time</label>
              <select
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-slate-800 font-medium bg-white"
              >
                <option value="">Select Time</option>
                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setMode('options')}
                className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-xl font-bold transition-all"
              >
                Back
              </button>
              <button
                onClick={handlePostpone}
                disabled={updateStatusMutation.isPending}
                className="flex-1 bg-teal-600 text-white hover:bg-teal-700 px-4 py-2.5 rounded-xl font-bold transition-all flex justify-center items-center"
              >
                {updateStatusMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
