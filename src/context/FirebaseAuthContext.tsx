'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  sendOTP: (phone: string, recaptchaVerifier: RecaptchaVerifier) => Promise<any>;
  verifyOTP: (confirmationResult: any, otp: string) => Promise<User>;
  getToken: () => Promise<string | null>;
  handleLoginSuccess: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  pharmacist: '/pharmacy/dashboard',
  PHARMACIST: '/pharmacy/dashboard',
  patient: '/patient/dashboard',
  PATIENT: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  DOCTOR: '/doctor/dashboard',
  staff: '/staff/dashboard',
  STAFF: '/staff/dashboard',
};

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Just set the Firebase Auth user — no Firestore calls here
      // Firestore sync is handled by the session API (Admin SDK)
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    return result.user;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  const sendOTP = async (phone: string, recaptchaVerifier: RecaptchaVerifier) => {
    const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
    return confirmationResult;
  };

  const verifyOTP = async (confirmationResult: any, otp: string) => {
    const result = await confirmationResult.confirm(otp);
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/landing');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken();
  };

  // After login, call the session API to get the role, then redirect
  const handleLoginSuccess = async (loggedInUser: User) => {
    try {
      const token = await loggedInUser.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        const data = await res.json();
        const role = data.user?.role || 'PATIENT';
        router.push(ROLE_ROUTES[role] || '/patient/dashboard');
      } else {
        router.push('/patient/dashboard');
      }
    } catch {
      router.push('/patient/dashboard');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      resetPassword,
      loginWithGoogle,
      sendOTP,
      verifyOTP,
      getToken,
      handleLoginSuccess
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return context;
}
