import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, error, className, id, placeholder: _placeholder, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || label.replace(/\s+/g, '-').toLowerCase();
    const hasValue = !!(props.value || props.defaultValue);

    return (
      <div className="relative w-full">
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'peer flex h-14 w-full rounded-md border border-border bg-transparent px-3 pt-5 pb-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus-visible:ring-error',
            className
          )}
          // Use dynamic placeholder so helper text only shows when focused
          placeholder={isFocused ? (_placeholder || " ") : " "}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            // Default floated position (small, top)
            'pointer-events-none absolute left-3 top-2 text-xs font-medium text-muted-foreground transition-all duration-200',
            // When input is empty and not focused, show as large centered placeholder
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal',
            // When focused, has value, or is autofilled, float back to top
            'peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-primary',
            'peer-autofill:top-2 peer-autofill:-translate-y-0 peer-autofill:text-xs',
            'peer-[-webkit-autofill]:top-2 peer-[-webkit-autofill]:-translate-y-0 peer-[-webkit-autofill]:text-xs',
            // Force floated state if value exists (controlled components)
            (isFocused || hasValue) && 'top-2 translate-y-0 text-xs font-medium',
            error && 'text-error peer-focus:text-error'
          )}
        >
          {label}
        </label>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </div>
    );
  }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';
