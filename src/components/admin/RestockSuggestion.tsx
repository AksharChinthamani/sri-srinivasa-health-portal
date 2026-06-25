'use client';import { useContext } from 'react';

import { ShoppingCart } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

interface RestockSuggestionProps {
  medicines: any[];
}

export function RestockSuggestion({ medicines }: RestockSuggestionProps) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const suggestions = medicines
    .filter((med) => med.active && med.stock <= 20)
    .map((med) => {
      // Suggest quantity to bring stock up to 100 or 500 depending on category
      const target = med.category === 'General' ? 500 : 200;
      const suggestedQty = target - med.stock;
      return {
        id: med.id,
        name: med.name,
        category: med.category,
        stock: med.stock,
        suggestedQty,
        confidence: 95,
      };
    });

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-100 text-teal-600 rounded-xl">
          <ShoppingCart size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            {getTranslation(language, 'auto.ai_restock_suggestions')}<span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
              {getTranslation(language, 'auto.beta')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {getTranslation(language, 'auto.suggested_restock_quantities_based_on_cu')}</p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
          {getTranslation(language, 'auto.all_stock_levels_are_currently_healthy_n')}</p>
      ) : (
        <div className="bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-12 p-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
            <div className="col-span-5">{getTranslation(language, 'auto.medicine')}</div>
            <div className="col-span-3 text-center">{getTranslation(language, 'auto.current_stock')}</div>
            <div className="col-span-4 text-center">{getTranslation(language, 'auto.suggested_restock')}</div>
          </div>
          <div className="divide-y divide-slate-100">
            {suggestions.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 p-3 items-center hover:bg-white transition-colors"
              >
                <div className="col-span-5">
                  <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                  <div className="text-[10px] text-slate-500">{item.category}</div>
                </div>
                <div className="col-span-3 text-center font-mono font-semibold text-slate-600">
                  {item.stock}
                </div>
                <div className="col-span-4 text-center">
                  <span className="inline-block font-mono font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-100 text-xs">
                    +{item.suggestedQty} {getTranslation(language, 'auto.units')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
