'use client';
import { useContext } from 'react';
import { useEffect } from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export function DisplayBoard({ tokens, onExit }: { tokens: any[]; onExit: () => void }) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const current = tokens.find(t => t.status === 'CALLED');
  const next = tokens.filter(t => t.status === 'WAITING').slice(0, 4);

  useEffect(() => {
    // Auto-refresh every 10 seconds
    const timer = setInterval(() => {
      // we can trigger a refetch from parent or just let the parent manage
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 to-blue-700 text-white flex flex-col items-center justify-center z-50">
      <div className="absolute top-4 left-4 text-2xl font-bold">{getTranslation(language, 'auto.sri_srinivasa_hospital')}</div>
      <button
        onClick={onExit}
        className="absolute top-4 right-4 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition"
      >
        {getTranslation(language, 'auto.exit_display')}</button>

      <div className="text-center">
        <div className="text-sm uppercase tracking-wider opacity-70 mb-2">{getTranslation(language, 'auto.now_serving')}</div>
        {current ? (
          <div className="text-8xl font-bold animate-pulse">#{current.tokenNumber}</div>
        ) : (
          <div className="text-4xl">{getTranslation(language, 'auto.no_patient_called')}</div>
        )}
        {current && (
          <div className="text-xl mt-2 opacity-80">{current.patient.name}</div>
        )}
      </div>

      <div className="mt-12 text-center">
        <div className="text-sm uppercase tracking-wider opacity-70 mb-4">{getTranslation(language, 'auto.up_next')}</div>
        <div className="flex gap-8 justify-center">
          {next.length > 0 ? next.map((t, _idx) => (
            <div key={t.id} className="text-3xl font-light">
              #{t.tokenNumber}
              <div className="text-sm opacity-60">{t.patient.name}</div>
            </div>
          )) : (
            <div className="text-xl opacity-50">{getTranslation(language, 'auto.no_waiting_patients')}</div>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 text-sm opacity-50">
        {getTranslation(language, 'auto.last_updated')}{new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
