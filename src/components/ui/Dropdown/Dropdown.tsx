import React from 'react';
import { cn } from '@/lib/utils/cn';

interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ className, trigger, isOpen, onClose, children, ...props }, ref) => {
    return (
      <div className="relative inline-block text-left" ref={ref} {...props}>
        <div>{trigger}</div>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={onClose}
              aria-hidden="true"
            ></div>
            <div
              className={cn(
                'absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border border-border bg-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
                className
              )}
            >
              <div className="py-1">{children}</div>
            </div>
          </>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export const DropdownItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover hover:text-primary focus:bg-surface-hover focus:outline-none',
          className
        )}
        {...props}
      />
    );
  }
);

DropdownItem.displayName = 'DropdownItem';
