'use client';
import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

async function fetchInsight() {
  const res = await fetch('/api/ai/insight');
  if (!res.ok) throw new Error('Failed to fetch insight');
  return res.json();
}

export function AIInsightCard() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const { data, isLoading } = useQuery({
    queryKey: ['aiInsight'],
    queryFn: fetchInsight,
    refetchInterval: 300000, // refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-teal-50 to-white p-4 rounded-lg border border-teal-200 animate-pulse">
        <div className="h-6 bg-teal-200/50 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-teal-50 to-white p-4 rounded-lg border border-teal-200">
      <div className="flex items-start gap-3">
        <Sparkles size={20} className="text-teal-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-700">{data?.insight || 'Stay healthy!'}</p>
          <span className="text-xs text-gray-400">{getTranslation(language, 'auto.ai_assisted')}</span>
        </div>
      </div>
    </div>
  );
}
