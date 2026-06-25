'use client';
import { useContext } from 'react';
import { useState } from 'react';
import { X } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

interface LeaveRequestModalProps {
  staff: any;
  onClose: () => void;
  onSubmit: (data: { startDate: string; endDate: string; reason: string }) => void;
}

export function LeaveRequestModal({ staff, onClose, onSubmit }: LeaveRequestModalProps) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ startDate, endDate, reason });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{getTranslation(language, 'auto.request_leave_for')}{staff.user?.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">{getTranslation(language, 'auto.start_date')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{getTranslation(language, 'auto.end_date')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{getTranslation(language, 'auto.reason')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition"
          >
            {getTranslation(language, 'auto.submit_request')}</button>
        </form>
      </div>
    </div>
  );
}
