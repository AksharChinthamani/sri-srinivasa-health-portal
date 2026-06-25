'use client';

import type { ReactNode } from 'react';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Header } from '@/components/layout/Header/Header';
import AIChatbot from '@/components/ui/AIChatbot/AIChatbot';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const authContext = useContext(AuthContext);

  if (authContext?.isLoading) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* Skeleton Sidebar */}
        <aside className="w-64 bg-slate-900 flex-shrink-0 animate-pulse border-r border-slate-800 flex flex-col">
          <div className="h-16 border-b border-slate-800"></div>
          <div className="p-4 space-y-4 mt-6">
            <div className="h-10 bg-slate-800 rounded"></div>
            <div className="h-10 bg-slate-800 rounded"></div>
            <div className="h-10 bg-slate-800 rounded"></div>
            <div className="h-10 bg-slate-800 rounded"></div>
          </div>
        </aside>
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Skeleton Header */}
          <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 flex-shrink-0 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 rounded"></div>
            <div className="flex gap-4">
              <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
              <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
            </div>
          </header>

          {/* Skeleton Content */}
          <main className="flex-1 p-6 overflow-auto bg-slate-50">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-slate-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-slate-200 rounded-xl"></div>
                <div className="h-32 bg-slate-200 rounded-xl"></div>
                <div className="h-32 bg-slate-200 rounded-xl"></div>
              </div>
              <div className="h-64 bg-slate-200 rounded-xl"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto p-6 pb-24 md:pb-6">{children}</main>
      </div>
      <AIChatbot />
    </div>
  );
}
