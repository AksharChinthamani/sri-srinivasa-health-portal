'use client';
import { useContext } from 'react';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function OrderMedicinesRedirectPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const router = useRouter();

  useEffect(() => {
    router.replace('/patient/pharmacy');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
      <p className="text-slate-500 font-medium text-sm animate-pulse">{getTranslation(language, 'auto.loading_sri_srinivasa_pharmacy')}</p>
    </div>
  );
}
