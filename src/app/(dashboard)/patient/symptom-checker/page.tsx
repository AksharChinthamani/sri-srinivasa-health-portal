'use client';
import { useContext } from 'react';
import { SymptomFlow } from '@/components/patient/SymptomChecker/SymptomFlow';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

export default function SymptomCheckerPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-secondary mb-2">{getTranslation(language, 'auto.symptom_checker')}</h1>
      <p className="text-gray-500 text-sm mb-6">
        {getTranslation(language, 'auto.tell_us_about_your_symptoms_and_we_apos_')}</p>
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <SymptomFlow />
      </div>
      <div className="mt-4 text-xs text-gray-400">
        {getTranslation(language, 'auto.this_is_for_guidance_only_consult_a_qual')}</div>
    </div>
  );
}
