'use client';
import { useContext } from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

export function TokenCard() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en'; return <div>{getTranslation(language, 'auto.tokencard')}</div>; }
