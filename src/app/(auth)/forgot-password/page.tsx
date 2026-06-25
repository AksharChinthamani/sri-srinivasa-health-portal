'use client';
import { useContext } from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";



export default function ForgotPasswordPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-2xl font-bold text-center mb-6">{getTranslation(language, 'auto.reset_password')}</h1>
      {/* ForgotPasswordForm component will be imported here */}
      <p className="text-center text-gray-600">{getTranslation(language, 'auto.forgot_password_form_coming_soon')}</p>
    </div>
  );
}
