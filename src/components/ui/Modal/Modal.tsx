'use client';
import { useContext } from 'react';
import React from 'react';
import { cn } from '@/lib/utils/cn';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, title, description, children, ...props }, ref) => {
        const langContext = useContext(LanguageContext);
          const language = langContext?.language || 'en';
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div
          ref={ref}
          className={cn(
            'relative w-full max-w-lg overflow-hidden rounded-xl bg-surface p-6 text-left align-middle shadow-xl transition-all',
            className
          )}
          {...props}
        >
          {title && (
            <h3 className="mb-2 text-lg font-semibold leading-none tracking-tight text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="mb-4 text-sm text-muted-foreground">{description}</p>
          )}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <span className="sr-only">{getTranslation(language, 'auto.close')}</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';
