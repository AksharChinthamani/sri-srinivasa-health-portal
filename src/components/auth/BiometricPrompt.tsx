'use client';
import { useContext } from 'react';
import React from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export const BiometricPrompt: React.FC = () => {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  return (
    <div className="text-center p-8">
      <div className="text-6xl mb-4">👆</div>
      <h3 className="text-lg font-semibold mb-2">{getTranslation(language, 'auto.biometric_authentication')}</h3>
      <p className="text-gray-600 mb-4">{getTranslation(language, 'auto.place_your_finger_on_the_sensor_to_authe')}</p>
      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
        {getTranslation(language, 'auto.use_biometric')}</button>
    </div>
  );
};
