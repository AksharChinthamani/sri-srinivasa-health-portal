'use client';
import { useContext } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

export function ResultCard({ result, onBookAppointment }: any) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  if (!result) return null;

  const urgencyColors: Record<string, string> = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    High: 'bg-red-100 text-red-800 border-red-200',
  };

  const urgencyIcons: Record<string, JSX.Element> = {
    Low: <CheckCircle size={24} className="text-green-600" />,
    Medium: <Info size={24} className="text-yellow-600" />,
    High: <AlertCircle size={24} className="text-red-600" />,
  };

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg border ${urgencyColors[result.urgency] || 'bg-gray-100'}`}>
        <div className="flex items-center gap-3">
          {urgencyIcons[result.urgency] || urgencyIcons.Low}
          <div>
            <p className="font-semibold">{getTranslation(language, 'auto.urgency')}{result.urgency}</p>
            <p className="text-sm opacity-80">{getTranslation(language, 'auto.recommended_specialist')}{result.specialist}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700">{result.reasoning}</p>
      </div>

      <button
        onClick={onBookAppointment}
        className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
      >
        {getTranslation(language, 'auto.book_appointment_with')}{result.specialist}
      </button>

      <div className="text-xs text-gray-400 text-center">
        {getTranslation(language, 'auto.this_is_ai_assisted_guidance_please_cons')}</div>
    </div>
  );
}
