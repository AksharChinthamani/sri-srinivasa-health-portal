import { useContext } from 'react';
import { LanguageContext } from '@/context/LanguageContext';
import { getTranslation } from '@/lib/i18n';

export function AIRecommendation() {
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  return (
    <div className="bg-gradient-to-r from-teal-50 to-white p-4 rounded-lg border border-teal-200 mb-6 flex items-start gap-4">
      <div className="text-xl">💡</div>
      <div>
        <p className="text-sm text-gray-700"><strong>{getTranslation(language, 'book_appointment.ai_suggestion')}:</strong> {getTranslation(language, 'book_appointment.ai_message')}</p>
        <span className="text-xs text-teal-600 font-semibold">{getTranslation(language, 'book_appointment.ai_assisted')}</span>
      </div>
    </div>
  );
}
