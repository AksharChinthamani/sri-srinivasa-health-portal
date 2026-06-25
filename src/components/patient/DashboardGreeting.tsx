'use client';
import { useContext } from 'react';
import React from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export const DashboardGreeting: React.FC<{ userName?: string }> = ({ userName = 'User' }) => {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">
        {getGreeting()}, {userName}! 👋
      </h1>
      <p className="text-gray-600 mt-2">{getTranslation(language, 'auto.welcome_back_to_your_health_portal')}</p>
    </div>
  );
};
