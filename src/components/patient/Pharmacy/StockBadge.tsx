'use client';
import { useContext } from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

export function StockBadge({ status }: { status: string }) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  if (status === 'In Stock') {
    return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">{getTranslation(language, 'auto.in_stock')}</span>;
  }
  if (status === 'Low') {
    return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase tracking-wider">{getTranslation(language, 'auto.low_stock')}</span>;
  }
  return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase tracking-wider">{getTranslation(language, 'auto.out_of_stock')}</span>;
}
