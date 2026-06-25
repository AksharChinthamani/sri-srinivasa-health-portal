'use client';

import type { ReactNode } from 'react';
import { Providers } from './providers';
import { FirebaseAuthProvider } from '@/context/FirebaseAuthContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/context/ToastContext';
import '@/styles/globals.css';

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <title>Sri Srinivasa Health Portal</title>
        <meta name="description" content="Comprehensive Healthcare Management Platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Providers>
          <ThemeProvider>
            <LanguageProvider>
              <FirebaseAuthProvider>
                <AuthProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </AuthProvider>
              </FirebaseAuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
