'use client';
import { useContext } from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";



export default function AdminRevenueP() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{getTranslation(language, 'auto.revenue_analytics')}</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <p className="text-gray-600">{getTranslation(language, 'auto.revenue_chart_coming_soon')}</p>
        </div>
      </div>
    </div>
  );
}
