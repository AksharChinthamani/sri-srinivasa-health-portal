'use client';
import { useContext } from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";


const commonSymptoms = ['Fever', 'Cough', 'Headache', 'Nausea', 'Fatigue', 'Dizziness', 'Chest Pain', 'Shortness of Breath'];

export function AdditionalSymptoms({ value, onChange }: any) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const toggleSymptom = (symptom: string) => {
    if (value.includes(symptom)) {
      onChange(value.filter((s: string) => s !== symptom));
    } else {
      onChange([...value, symptom]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{getTranslation(language, 'auto.any_other_symptoms')}</h3>
      <p className="text-sm text-gray-500">{getTranslation(language, 'auto.select_all_that_apply')}</p>
      <div className="flex flex-wrap gap-2">
        {commonSymptoms.map((s) => (
          <button
            key={s}
            onClick={() => toggleSymptom(s)}
            className={`px-3 py-2 rounded-full border text-sm transition ${
              value.includes(s)
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
