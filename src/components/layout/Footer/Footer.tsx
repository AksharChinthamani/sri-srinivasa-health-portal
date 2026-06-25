'use client';
import { useContext } from 'react';
import React from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export const Footer: React.FC = () => {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  return (
    <footer className="bg-gray-900 text-white py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4">{getTranslation(language, 'auto.company')}</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.about_us')}</a></li>
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.careers')}</a></li>
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.contact')}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{getTranslation(language, 'auto.services')}</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.appointments')}</a></li>
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.consultations')}</a></li>
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.pharmacy')}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{getTranslation(language, 'auto.legal')}</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.privacy')}</a></li>
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.terms')}</a></li>
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.disclaimer')}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{getTranslation(language, 'auto.follow_us')}</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.facebook')}</a></li>
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.twitter')}</a></li>
              <li><a href="#" className="hover:text-white">{getTranslation(language, 'auto.linkedin')}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 text-center text-gray-400">
          <p>{getTranslation(language, 'auto.copy_2024_sri_srinivasa_health_portal_al')}</p>
        </div>
      </div>
    </footer>
  );
};
