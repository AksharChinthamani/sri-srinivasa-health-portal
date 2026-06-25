'use client';
import { useContext } from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

const durations = ['Hours', 'Days', 'Weeks', 'Months', 'Years'];

export function DurationSelector({ value, onChange }: any) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{getTranslation(language, 'auto.since_when')}</h3>
      <div className="flex flex-wrap gap-2">
        {durations.map((d) => (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={`px-4 py-2 rounded-full border text-sm transition ${
              value === d
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}
