'use client';

import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { LanguageContext } from '@/context/LanguageContext';
import { getTranslation } from '@/lib/i18n';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown/Dropdown';

export const Header: React.FC = () => {
  const authContext = useContext(AuthContext);
  const langContext = useContext(LanguageContext);
  const { language, changeLanguage } = langContext || { language: 'en', changeLanguage: () => {} };
  const router = useRouter();
  const [currentView, setCurrentView] = useState('Hospital');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authContext?.user) return;
    
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/chat/unread');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [authContext?.user]);

  const isAdmin = authContext?.user?.role === 'ADMIN';
  const isPatient = authContext?.user?.role === 'PATIENT';

  return (
    <header className="bg-white shadow-sm px-4 md:px-6 py-4 flex justify-between items-center w-full z-10 sticky top-0">
      <div className="flex items-center gap-2 md:gap-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <svg className="w-8 h-8 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <div className="text-sm md:text-lg font-bold text-teal-800 hidden sm:block">
            {getTranslation(language, 'auto.sri_srinivasa_medical_store_hospital')}</div>
          <div className="text-sm md:text-lg font-bold text-teal-800 sm:hidden">
            {getTranslation(language, 'auto.sri_srinivasa')}</div>
        </div>
        
        {/* Role Switcher (Admin only) */}
        {isAdmin && (
          <div className="hidden md:flex relative border-b-2 border-slate-200">
            <button
              onClick={() => {
                setCurrentView('Hospital');
                router.push('/admin/dashboard');
              }}
              className={`relative px-4 py-3 text-sm font-bold transition-colors z-10 ${
                currentView === 'Hospital' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {getTranslation(language, 'auto.hospital')}</button>
            <button
              onClick={() => {
                setCurrentView('Pharmacy');
                router.push('/pharmacy/dashboard');
              }}
              className={`relative px-4 py-3 text-sm font-bold transition-colors z-10 ${
                currentView === 'Pharmacy' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {getTranslation(language, 'auto.pharmacy')}</button>
            
            {/* Sliding Underline */}
            <div 
              className="absolute bottom-[-2px] left-0 h-0.5 bg-teal-600 transition-transform duration-300 ease-in-out"
              style={{
                width: currentView === 'Hospital' ? '82px' : '92px',
                transform: currentView === 'Hospital' ? 'translateX(0)' : 'translateX(82px)'
              }}
            ></div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 md:gap-4">


        {/* Notification Bell with Badge */}
        <button 
          onClick={() => router.push(isAdmin ? '/admin/chat' : isPatient ? '/patient/chat' : '/pharmacy/chat')}
          className="text-slate-400 hover:text-teal-600 transition-colors relative"
          title={getTranslation('en', 'auto.messages')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar + Role Chip */}
        <div className="flex items-center gap-2">
          {isPatient && (
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
              {getTranslation('en', 'auto.patient')}</span>
          )}
          <Dropdown
            isOpen={dropdownOpen}
            onClose={() => setDropdownOpen(false)}
            trigger={
              <button onClick={() => setDropdownOpen(!dropdownOpen)}>
                <Avatar alt={authContext?.user?.name || 'User'} fallback={authContext?.user?.name?.[0] || 'U'} size="sm" />
              </button>
            }
          >
            <DropdownItem onClick={() => { console.log('Profile'); setDropdownOpen(false); }}>{getTranslation('en', 'auto.profile')}</DropdownItem>
            <DropdownItem onClick={() => { console.log('Settings'); setDropdownOpen(false); }}>{getTranslation('en', 'common.settings')}</DropdownItem>
            <DropdownItem onClick={() => { authContext?.logout(); setDropdownOpen(false); }}>{getTranslation('en', 'common.logout')}</DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};
