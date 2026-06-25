'use client';

import { useCallback, useState } from 'react';

export function useLanguage() {
  const [language, setLanguage] = useState('en');

  const changeLanguage = useCallback((lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  }, []);

  return { language, changeLanguage };
}
