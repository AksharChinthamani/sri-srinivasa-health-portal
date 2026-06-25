'use client';
import { useContext } from 'react';
import React from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export const AIBadge: React.FC = () => {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
      {getTranslation(language, 'auto.ai')}</span>
  );
};
