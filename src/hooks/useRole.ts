'use client';

import { useCallback, useState } from 'react';

export function useRole() {
  const [role, setRole] = useState<string | null>(null);

  const hasRole = useCallback((requiredRole: string) => {
    return role === requiredRole;
  }, [role]);

  return { role, setRole, hasRole };
}
