'use client';
import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

export function RevenueForecast() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const { data, isLoading, error } = useQuery({
    queryKey: ['revenueForecast'],
    queryFn: () => fetch('/api/ai/revenue-forecast').then(res => res.json())
  });

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border h-full flex flex-col justify-center animate-pulse">
        <div className="h-6 w-1/2 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 w-1/3 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border h-full flex flex-col justify-center text-gray-500">
        <p>{getTranslation(language, 'auto.unable_to_generate_forecast')}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg shadow-sm border border-indigo-100 h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-indigo-900">{getTranslation(language, 'auto.ai_revenue_forecast_next_30_days')}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          data.confidence === 'High' ? 'bg-green-100 text-green-700' :
          data.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {data.confidence} {getTranslation(language, 'auto.confidence')}</span>
      </div>
      
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-indigo-700">
            ₹{data.forecast?.toLocaleString() || 0}
          </span>
          <span className="text-sm text-indigo-500">{getTranslation(language, 'auto.day')}</span>
        </div>
        
        <p className="text-sm text-indigo-800 leading-relaxed mt-4 bg-white/50 p-3 rounded border border-indigo-50">
          {data.explanation}
        </p>
      </div>
    </div>
  );
}
