'use client';
import { useContext } from 'react';
import React from 'react';
import Link from 'next/link';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export const QuickActions: React.FC = () => {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const actions = [
    { label: 'Book Appointment', href: '/patient/appointments/book', icon: '📅' },
    { label: 'Upload Record', href: '/patient/records', icon: '📄' },
    { label: 'View Prescriptions', href: '/patient/prescriptions', icon: '💊' },
    { label: 'Chat with Doctor', href: '/patient/chat', icon: '💬' },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="bg-white p-4 rounded-lg shadow text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="text-3xl mb-2">{action.icon}</div>
              <p className="text-sm font-semibold text-gray-700">{action.label}</p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="flex justify-start">
        <Link href="/patient/orders">
          <button className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full whitespace-nowrap text-sm hover:bg-teal-100 transition">
            {getTranslation(language, 'auto.track_order')}</button>
        </Link>
      </div>
    </div>
  );
};
