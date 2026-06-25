'use client';
import { useContext } from 'react';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FloatingLabelInput } from '@/components/ui/Input/FloatingLabelInput';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card/Card';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function LoginPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{getTranslation(language, 'auto.sign_in')}</CardTitle>
          <CardDescription>{getTranslation(language, 'auto.enter_your_email_and_password_to_access_')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                {error}
              </div>
            )}
            <FloatingLabelInput
              type="email"
              label={getTranslation(language, 'auto.email')}
              placeholder={getTranslation(language, 'auto.name_example_com')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FloatingLabelInput
              type="password"
              label={getTranslation(language, 'auto.password')}
              placeholder={getTranslation(language, 'auto.key_tjvqum')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <div className="flex items-center justify-end">
              <Link href="#" className="text-sm text-primary hover:underline">
                {getTranslation(language, 'auto.forgot_password')}</Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-muted-foreground">{getTranslation(language, 'auto.or_continue_with')}</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={() => console.log('Send OTP')}>
              {getTranslation(language, 'auto.send_otp')}</Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            {getTranslation(language, 'auto.new_patient')}{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              {getTranslation(language, 'auto.create_a_patient_account')}</Link>
          </p>
          <p className="text-xs text-muted-foreground/60">
            {getTranslation(language, 'auto.admin_pharmacist_amp_doctor_accounts_are')}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
