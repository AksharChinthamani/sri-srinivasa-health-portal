'use client';
import { useContext } from 'react';
import React from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export const Disclaimer: React.FC = () => {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-sm text-yellow-800">
        <strong>{getTranslation(language, 'auto.disclaimer')}</strong> {getTranslation(language, 'auto.this_is_a_health_information_portal_plea')}</p>
    </div>
  );
};
