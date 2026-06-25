'use client';
import { useContext } from 'react';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export function ConfirmationModal({ doctor, date, slot, onConfirm, onCancel }: any) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 transform transition-all scale-100">
        <h2 className="text-xl font-bold mb-4">{getTranslation(language, 'auto.confirm_appointment')}</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">{getTranslation(language, 'auto.doctor')}</span> {doctor.name}</p>
          <p><span className="font-medium">{getTranslation(language, 'auto.specialty')}</span> {doctor.specialty}</p>
          <p><span className="font-medium">{getTranslation(language, 'auto.date')}</span> {format(date, 'EEEE, MMMM d, yyyy')}</p>
          <p><span className="font-medium">{getTranslation(language, 'auto.time')}</span> {slot}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">{getTranslation(language, 'auto.cancel')}</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">{getTranslation(language, 'auto.confirm')}</button>
        </div>
      </div>
    </div>
  );
}
