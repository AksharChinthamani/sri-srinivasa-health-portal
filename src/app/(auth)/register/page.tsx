'use client';
import { useContext } from 'react';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/client';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { FloatingLabelInput } from '@/components/ui/Input/FloatingLabelInput';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card/Card';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function RegisterPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const { isAuthenticated, user } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const roleMap: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        PHARMACIST: '/pharmacy/dashboard',
        PATIENT: '/patient/dashboard',
        DOCTOR: '/doctor/dashboard',
        STAFF: '/staff/dashboard',
      };
      router.push(roleMap[user.role] || '/patient/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, { displayName: formData.name });

      const token = await userCredential.user.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: formData.name,
          phone: formData.phone,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/login?registered=true');
    } catch (err: any) {
      let msg = err.message || 'Registration failed';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{getTranslation(language, 'auto.register')}</CardTitle>
          <CardDescription>{getTranslation(language, 'auto.create_a_patient_account')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                {error}
              </div>
            )}
            <FloatingLabelInput
              label={getTranslation(language, 'auto.full_name')}
              name="name"
              placeholder={getTranslation(language, 'auto.john_doe')}
              value={formData.name}
              onChange={handleChange}
              required
            />
            <FloatingLabelInput
              type="email"
              label={getTranslation(language, 'auto.email')}
              name="email"
              placeholder={getTranslation(language, 'auto.name_example_com')}
              value={formData.email}
              onChange={handleChange}
              required
            />
            <FloatingLabelInput
              type="tel"
              label={getTranslation(language, 'auto.phone')}
              name="phone"
              placeholder={getTranslation(language, 'auto.1234567890')}
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <FloatingLabelInput
              type="password"
              label={getTranslation(language, 'auto.password')}
              name="password"
              placeholder={getTranslation(language, 'auto.key_whkn6')}
              value={formData.password}
              onChange={handleChange}
              required
            />
            <FloatingLabelInput
              type="password"
              label={getTranslation(language, 'auto.confirm_password')}
              name="confirmPassword"
              placeholder={getTranslation(language, 'auto.key_xxh1ke')}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register as Patient'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {getTranslation(language, 'auto.already_have_an_account')}{' '}
            <Link href="/login" className="text-primary hover:underline">
              {getTranslation(language, 'auto.sign_in')}</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
