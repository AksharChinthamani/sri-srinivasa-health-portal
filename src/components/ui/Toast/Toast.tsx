'use client';
import { useContext } from 'react';
import React from 'react';
import { cn } from '@/lib/utils/cn';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error';
  title?: string;
  description?: string;
  onClose?: () => void;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', title, description, onClose, ...props }, ref) => {
        const langContext = useContext(LanguageContext);
          const language = langContext?.language || 'en';
    const variants = {
      default: 'bg-surface border-border text-foreground',
      success: 'bg-success text-success-foreground border-success',
      warning: 'bg-warning text-warning-foreground border-warning',
      error: 'bg-error text-error-foreground border-error',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-auto flex w-full max-w-md items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex w-full flex-col gap-1">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {description && <p className="text-sm opacity-90">{description}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <span className="sr-only">{getTranslation(language, 'auto.close')}</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';
