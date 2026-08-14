'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAuth } from '@/app/api/hooks/useAuth';
import { tokenManager } from '@/app/api';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { user, clearUser, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && user && !tokenManager.getAccessToken()) {
      clearUser();
    }
  }, [user, clearUser, _hasHydrated]);

  useAuth();

  return <>{children}</>;
}
