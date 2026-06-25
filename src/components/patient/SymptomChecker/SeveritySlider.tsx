'use client';
import { useContext } from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";


export function SeveritySlider({ value, onChange }: any) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{getTranslation(language, 'auto.rate_severity_1_10')}</h3>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{getTranslation(language, 'auto.mild')}</span>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 accent-teal-500"
        />
        <span className="text-sm text-gray-500">{getTranslation(language, 'auto.severe')}</span>
        <span className="ml-4 text-xl font-bold text-teal-600 w-8 text-center">{value}</span>
      </div>
    </div>
  );
}
