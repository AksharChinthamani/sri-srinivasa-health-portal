'use client';
import { useContext } from 'react';
import React from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

interface RoleGuardProps {
  allowedRoles: string[];
  userRole: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  userRole,
  children,
  fallback = <div>{'Access Denied'}</div>,
}) => {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  if (allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};
