'use client';
import { useContext } from 'react';
import { AlertTriangle } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

export function DrugInteractionBanner({ items }: { items: any[] }) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  // Simple rule: if two items have certain categories, show warning
  const categories = items.map(i => i.category || '');
  const hasInteraction = categories.includes('Antibiotic') && categories.includes('Antacid');
  if (!hasInteraction) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="bg-amber-100 p-2 rounded-full text-amber-600 flex-shrink-0">
        <AlertTriangle size={20} />
      </div>
      <div>
        <h4 className="font-bold text-amber-900">{getTranslation(language, 'auto.potential_drug_interaction_detected')}</h4>
        <p className="text-sm text-amber-800 mt-1">
          {getTranslation(language, 'auto.taking')}<span className="font-semibold">{getTranslation(language, 'auto.antibiotics')}</span> {getTranslation(language, 'auto.with')}<span className="font-semibold">{getTranslation(language, 'auto.antacids')}</span> {getTranslation(language, 'auto.may_reduce_effectiveness_please_consult_')}</p>
      </div>
    </div>
  );
}
