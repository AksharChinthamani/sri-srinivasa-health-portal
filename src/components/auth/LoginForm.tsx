'use client';import { useContext } from 'react';


import React from 'react';
import { FloatingLabelInput } from '@/components/ui/Input/FloatingLabelInput';
import { Button } from '@/components/ui/Button/Button';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export const LoginForm: React.FC = () => {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FloatingLabelInput
        type="email"
        label={getTranslation(language, 'auto.email')}
        placeholder={getTranslation(language, 'auto.your_email_com')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <FloatingLabelInput
        type="password"
        label={getTranslation(language, 'auto.password')}
        placeholder={getTranslation(language, 'auto.key_8ijg23')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" className="w-full">
        {getTranslation(language, 'auto.login')}</Button>
      <p className="text-center text-gray-600 text-sm">
        {getTranslation(language, 'auto.don_apos_t_have_an_account')}<a href="/register" className="text-blue-600 hover:underline">{getTranslation(language, 'auto.register')}</a>
      </p>
    </form>
  );
};
