'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { authEndpoints } from '../endpoints/auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { tokenManager } from '@/app/api';
import type {
  UserCreateInput,
  UserLogin,
  PasswordResetRequest,
  PasswordReset,
} from '@/lib/types';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

const normalizeTokens = (tokens: any) => ({
  accessToken: tokens?.access_token ?? tokens?.accessToken ?? null,
  refreshToken: tokens?.refresh_token ?? tokens?.refreshToken ?? null,
});

export function useAuth() {
  const { setUser, user: storeUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const shouldFetch = !!tokenManager.getAccessToken() && _hasHydrated;

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: () => authEndpoints.getCurrentUser().then(res => res.data),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (query.data && query.data.id !== storeUser?.id) {
      setUser(query.data);
    }
  }, [query.data, storeUser?.id, setUser]);

  return {
    user: query.data || storeUser,
    isLoading: query.isLoading && shouldFetch,
    isAuthenticated: isAuthenticated || !!query.data,
    refetch: query.refetch,
  };
}

const handleAuthSuccess = (
  user: any,
  tokens: any,
  setUser: (user: any) => void,
  setTokens: (accessToken: string, refreshToken: string) => void,
  queryClient: any,
  router: any
) => {
  const normalized = normalizeTokens(tokens);
  if (normalized.accessToken && normalized.refreshToken) {
    setTokens(normalized.accessToken, normalized.refreshToken);
  }
  setUser(user);
  queryClient.setQueryData(authKeys.me, user);
  
  const paths: Record<string, string> = {
    admin: '/admin',
    owner: '/owner-dashboard',
    advertiser: '/advertiser-dashboard',
  };
  router.push(paths[user.userType] || '/');
};

export function useRegister() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserCreateInput) => authEndpoints.register(data),
    onSuccess: (response) => {
      const { user, tokens } = response.data;
      
      // Store tokens and user data
      const normalized = normalizeTokens(tokens);
      if (normalized.accessToken && normalized.refreshToken) {
        setTokens(normalized.accessToken, normalized.refreshToken);
      }
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
      
      // Redirect to the dedicated verification pending page
      router.push(
        `/verify-email/pending?email=${encodeURIComponent(user.email)}&type=${user.userType}`
      );
    },
  });
}

export function useLogin() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: UserLogin) => authEndpoints.login(credentials),
    onSuccess: (response) => {
      const { user, tokens } = response.data;
      handleAuthSuccess(user, tokens, setUser, setTokens, queryClient, router);
      toast.success(`Welcome back, ${user.fullName}!`);
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authEndpoints.logout(),
    onSuccess: () => {
      queryClient.clear();
      logout();
      toast.success('Logged out successfully');
    },
    onError: () => {
      queryClient.clear();
      logout();
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (data: PasswordResetRequest) => authEndpoints.requestPasswordReset(data),
    onSuccess: () => toast.success('Password reset link sent to your email'),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    },
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: PasswordReset) => authEndpoints.resetPassword(data),
    onSuccess: () => {
      toast.success('Password reset successful. Please login.');
      router.push('/login');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Password reset failed');
    },
  });
}
