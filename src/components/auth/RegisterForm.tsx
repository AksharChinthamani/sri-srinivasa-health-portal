'use client';import { useContext } from 'react';


import React from 'react';
import { FloatingLabelInput } from '@/components/ui/Input/FloatingLabelInput';
import { Button } from '@/components/ui/Button/Button';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export const RegisterForm: React.FC = () => {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Register:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FloatingLabelInput
        label={getTranslation(language, 'auto.full_name')}
        placeholder={getTranslation(language, 'auto.john_doe')}
        value={formData.name}
        onChange={handleChange}
        name="name"
        required
      />
      <FloatingLabelInput
        type="email"
        label={getTranslation(language, 'auto.email')}
        placeholder={getTranslation(language, 'auto.your_email_com')}
        value={formData.email}
        onChange={handleChange}
        name="email"
        required
      />
      <FloatingLabelInput
        type="tel"
        label={getTranslation(language, 'auto.phone')}
        placeholder={getTranslation(language, 'auto.9876543210')}
        value={formData.phone}
        onChange={handleChange}
        name="phone"
        required
      />
      <FloatingLabelInput
        type="password"
        label={getTranslation(language, 'auto.password')}
        placeholder={getTranslation(language, 'auto.key_9v43k4')}
        value={formData.password}
        onChange={handleChange}
        name="password"
        required
      />
      <Button type="submit" className="w-full">
        {getTranslation(language, 'auto.register')}</Button>
      <p className="text-center text-gray-600 text-sm">
        {getTranslation(language, 'auto.already_have_an_account')}<a href="/login" className="text-blue-600 hover:underline">{getTranslation(language, 'auto.login')}</a>
      </p>
    </form>
  );
};
