'use client';
import { useContext } from 'react';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function LandingPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            {getTranslation(language, 'auto.welcome_to')}<span className="text-primary">{getTranslation(language, 'auto.sri_srinivasa')}</span> {getTranslation(language, 'auto.health_portal')}</h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            {getTranslation(language, 'auto.your_all_in_one_destination_for_booking_')}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto px-8">
              {getTranslation(language, 'auto.sign_in')}</Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
              {getTranslation(language, 'auto.register_as_patient')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
