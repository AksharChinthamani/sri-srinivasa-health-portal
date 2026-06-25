'use client';
import { useContext } from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

const locations = ['Head', 'Chest', 'Abdomen', 'Back', 'Joints', 'Muscles', 'Throat', 'Other'];

export function PainLocationSelector({ value, onChange }: any) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{getTranslation(language, 'auto.where_is_the_pain')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {locations.map((loc) => (
          <button
            key={loc}
            onClick={() => onChange(loc)}
            className={`p-3 rounded-lg border text-sm transition ${
              value === loc
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {loc}
          </button>
        ))}
      </div>
    </div>
  );
}
