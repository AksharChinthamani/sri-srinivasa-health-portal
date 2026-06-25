'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'PHARMACIST' | 'STAFF' | 'PATIENT';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, name: firebaseUser.displayName }),
          });
          
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Session sync failed", error);
          setUser(null);
        }
      } else {
        setUser(null);
        await fetch('/api/auth/logout', { method: 'POST' }); // Ensure cookie is cleared
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // Authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    // Sync with backend to get role and set cookie
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name: userCredential.user.displayName }),
    });
    
    let data;
    try {
      const text = await res.text();
      data = JSON.parse(text);
    } catch(e) {
      throw new Error('Server returned an invalid response. Please check Vercel Logs.');
    }
    if (!res.ok) throw new Error(data.error || 'Login failed');
    
    setUser(data.user);
    
    // Redirect based on role
    const roleMap: Record<string, string> = {
      ADMIN: '/admin/dashboard',
      PHARMACIST: '/pharmacy/dashboard',
      PATIENT: '/patient/dashboard',
      DOCTOR: '/doctor/dashboard',
      STAFF: '/staff/dashboard',
    };
    
    const dashboardPath = roleMap[data.user.role] || '/patient/dashboard';
    router.push(dashboardPath);
  };

  const logout = async () => {
    await signOut(auth);
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/landing');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
