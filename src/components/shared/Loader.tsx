import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';

interface LoaderProps {
  variant?: 'spinner' | 'skeleton' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({ variant = 'spinner', size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (variant === 'skeleton') {
    return <Skeleton />;
  }

  if (variant === 'pulse') {
    return <div className={`${sizes[size]} bg-gray-300 animate-pulse rounded`} />;
  }

  return (
    <div className={`${sizes[size]} border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin`} />
  );
};
