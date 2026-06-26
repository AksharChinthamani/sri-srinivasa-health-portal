'use client';
import { useContext } from 'react';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
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
  const [otpCode, setOtpCode] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uiState, setUiState] = useState<'LOGIN' | 'OTP_INPUT'>('LOGIN');

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
    if (uiState === 'OTP_INPUT') {
      return handleVerifyOtp(e);
    }
    
    setError('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      let data;
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned an invalid response (500 Error). Please check Vercel Logs.`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email address first to receive an OTP.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setUiState('OTP_INPUT');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      // 1. Authenticate with Custom Token
      const userCred = await signInWithCustomToken(auth, data.customToken);
      
      // 2. Force session sync manually before redirecting
      const token = await userCred.user.getIdToken();
      const sessionRes = await fetch('/api/auth/session', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ token, name: userCred.user.displayName || email.split('@')[0] }),
      });
      const sessionData = await sessionRes.json();
      
      // 3. Redirect
      const roleMap: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        PHARMACIST: '/pharmacy/dashboard',
        PATIENT: '/patient/dashboard',
        DOCTOR: '/doctor/dashboard',
        STAFF: '/staff/dashboard',
      };
      router.push(roleMap[sessionData.user?.role || 'PATIENT'] || '/patient/dashboard');

    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {uiState === 'OTP_INPUT' ? 'Enter OTP' : getTranslation(language, 'auto.sign_in')}
          </CardTitle>
          <CardDescription>
            {uiState === 'OTP_INPUT' 
              ? `We sent a 6-digit code to ${email}`
              : getTranslation(language, 'auto.enter_your_email_and_password_to_access_')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error bg-error/10 rounded-md">
                {error}
              </div>
            )}
            
            {uiState === 'LOGIN' && (
              <>
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
                  <button type="button" onClick={handleSendOtp} className="text-sm text-primary hover:underline bg-transparent border-none cursor-pointer">
                    {getTranslation(language, 'auto.forgot_password')}
                  </button>
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

                <Button type="button" variant="outline" className="w-full" onClick={handleSendOtp} disabled={isLoading}>
                  {getTranslation(language, 'auto.send_otp')}
                </Button>
              </>
            )}

            {uiState === 'OTP_INPUT' && (
              <>
                 <FloatingLabelInput
                  type="text"
                  label="6-Digit Code"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  maxLength={6}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify OTP & Login'}
                </Button>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => setUiState('LOGIN')} className="text-sm text-primary hover:underline bg-transparent border-none cursor-pointer">
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </form>
        </CardContent>
        {uiState === 'LOGIN' && (
          <CardFooter className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">
              {getTranslation(language, 'auto.new_patient')}{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                {getTranslation(language, 'auto.create_a_patient_account')}
              </Link>
            </p>
            <p className="text-xs text-muted-foreground/60">
              {getTranslation(language, 'auto.admin_pharmacist_amp_doctor_accounts_are')}
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
