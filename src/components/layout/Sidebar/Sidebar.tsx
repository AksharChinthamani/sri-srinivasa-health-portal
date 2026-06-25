'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { LanguageContext } from '@/context/LanguageContext';
import { getTranslation } from '@/lib/i18n';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  translationKey?: string;
}

// Simple placeholder icons
const IconPlaceholder = () => (
  <svg className="w-5 h-5 mb-1 md:mb-0 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', translationKey: 'sidebar.dashboard', href: '/admin/dashboard', icon: <IconPlaceholder /> },
  { label: 'Doctors', translationKey: 'auto.doctor_management', href: '/admin/doctors', icon: <IconPlaceholder /> },
  { label: 'Queue', translationKey: 'auto.queue_management', href: '/admin/queue', icon: <IconPlaceholder /> },
  { label: 'Inventory', translationKey: 'auto.inventory', href: '/admin/inventory', icon: <IconPlaceholder /> },
  { label: 'Appointments', translationKey: 'auto.appointments', href: '/admin/appointments', icon: <IconPlaceholder /> },
  { label: 'Staff', translationKey: 'auto.staff', href: '/admin/staff', icon: <IconPlaceholder /> },
];

const PHARMACIST_NAV: NavItem[] = [
  { label: 'Dashboard', translationKey: 'sidebar.dashboard', href: '/pharmacy/dashboard', icon: <IconPlaceholder /> },
  { label: 'Inventory', translationKey: 'auto.inventory', href: '/pharmacy/inventory', icon: <IconPlaceholder /> },
  { label: 'Orders', translationKey: 'auto.orders', href: '/pharmacy/orders', icon: <IconPlaceholder /> },
  { label: 'Chats', translationKey: 'auto.chat', href: '/pharmacy/chat', icon: <IconPlaceholder /> },
];

const PATIENT_NAV: NavItem[] = [
  { label: 'Dashboard', translationKey: 'sidebar.dashboard', href: '/patient/dashboard', icon: <IconPlaceholder /> },
  { label: 'Book Appointment', translationKey: 'sidebar.book_appointment', href: '/patient/appointments/book', icon: <IconPlaceholder /> },
  { label: 'Virtual Consults', translationKey: 'sidebar.virtual_consults', href: '/patient/virtual-consult', icon: <IconPlaceholder /> },
  { label: 'My Records', translationKey: 'sidebar.my_records', href: '/patient/records', icon: <IconPlaceholder /> },
  { label: 'E-Prescriptions', translationKey: 'sidebar.e_prescriptions', href: '/patient/prescriptions', icon: <IconPlaceholder /> },
  { label: 'Order Medicines', translationKey: 'sidebar.order_medicines', href: '/patient/pharmacy', icon: <IconPlaceholder /> },
  { label: 'Chat with chemist', translationKey: 'sidebar.chat_chemist', href: '/patient/chat', icon: <IconPlaceholder /> },
];

const DOCTOR_NAV: NavItem[] = [
  { label: 'Dashboard', translationKey: 'sidebar.dashboard', href: '/doctor/dashboard', icon: <IconPlaceholder /> },
];

export const Sidebar: React.FC = () => {
  const authContext = useContext(AuthContext);
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const pathname = usePathname();

  let navItems: NavItem[] = [];
  
  if (authContext?.user) {
    const role = authContext.user.role;
    if (role === 'ADMIN') navItems = ADMIN_NAV;
    else if (role === 'PHARMACIST') navItems = PHARMACIST_NAV;
    else if (role === 'DOCTOR') navItems = DOCTOR_NAV;
    else navItems = PATIENT_NAV;
  }

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-20 bg-slate-900 text-slate-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] 
                      md:static md:w-64 md:min-h-screen md:flex md:flex-col md:shadow-none transition-all duration-300">
      <div className="hidden md:block p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">{getTranslation(language, 'sidebar.navigation')}</h1>
      </div>
      
      {/* Scrollable Nav Area */}
      <nav className="flex flex-row overflow-x-auto no-scrollbar md:flex-col md:mt-4 md:flex-grow p-2 md:p-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start min-w-[80px] md:min-w-0 flex-shrink-0 
                         px-2 py-3 md:px-6 md:py-3 transition-colors rounded-xl md:rounded-none mx-1 md:mx-0
                         ${isActive ? 'bg-teal-600/20 text-teal-400 md:border-r-4 md:border-teal-500' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              {item.icon}
              <span className="text-[10px] md:text-sm font-medium text-center md:text-left truncate w-full max-w-[80px] md:max-w-none mt-1 md:mt-0">
                {item.translationKey ? getTranslation(language, item.translationKey) : item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
      {authContext?.isAuthenticated && (
        <div className="hidden md:block p-6 border-t border-slate-800">
          <button 
            onClick={() => authContext.logout()}
            className="w-full bg-slate-800 hover:bg-red-600/90 text-slate-300 hover:text-white py-2 rounded-lg font-medium transition-colors"
          >
            {getTranslation(language, 'sidebar.logout')}
          </button>
        </div>
      )}
    </aside>
  );
};
