'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authEndpoints } from '../endpoints/auth';
import { getVerificationStatus, getKYCFormUrl, submitKYC } from '../endpoints/users';
import type { EmailVerificationRequest, KYCSubmission } from '@/lib/types';

export const verificationKeys = {
  status: ['verification', 'status'] as const,
  kycFormUrl: ['verification', 'kyc-form-url'] as const,
};

/**
 * Hook for verification status
 */
export function useVerificationStatus() {
  return useQuery({
    queryKey: verificationKeys.status,
    queryFn: () => getVerificationStatus().then(res => res.data),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for email verification
 */
export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => authEndpoints.verifyEmail(token),
    onSuccess: (response) => {
      toast.success(response.message || 'Email verified successfully!');
      // Invalidate verification status and user queries
      queryClient.invalidateQueries({ queryKey: verificationKeys.status });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Verification failed';
      toast.error(message);
    },
  });
}

/**
 * Hook for resending verification email
 */
export function useResendVerification() {
  return useMutation({
    mutationFn: (data: EmailVerificationRequest) => authEndpoints.resendVerification(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Verification email sent!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to send email';
      toast.error(message);
    },
  });
}

/**
 * Hook for KYC form URL
 */
export function useKYCFormUrl() {
  return useQuery({
    queryKey: verificationKeys.kycFormUrl,
    queryFn: () => getKYCFormUrl().then(res => res.data),
    enabled: false, // Only fetch when explicitly called
  });
}

/**
 * Hook for submitting KYC
 */
export function useSubmitKYC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: KYCSubmission) => submitKYC(data),
    onSuccess: (response) => {
      toast.success(response.message || 'KYC submission confirmed!');
      // Invalidate verification status and user queries
      queryClient.invalidateQueries({ queryKey: verificationKeys.status });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'KYC submission failed';
      toast.error(message);
    },
  });
}
