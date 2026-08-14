import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentEndpoints } from '../endpoints/payments'
import type { PaymentInitializeInput } from '@/lib/types/payment'
import { toast } from 'sonner'

// Query keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (page: number) => [...paymentKeys.lists(), { page }] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
}

/**
 * Hook to initialize a payment
 * Returns Paystack authorization URL to redirect user to
 */
export function useInitializePayment() {
  return useMutation({
    mutationFn: (data: PaymentInitializeInput) => paymentEndpoints.initializePayment(data),
    onSuccess: (response) => {
      // Redirect to Paystack payment page
      if (response.data.authorizationUrl) {
        window.location.href = response.data.authorizationUrl
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initialize payment')
    },
  })
}

/**
 * Hook to verify a payment after Paystack callback
 * Use with useEffect to handle side effects when data changes
 */
export function useVerifyPayment(reference: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [...paymentKeys.all, 'verify', reference],
    queryFn: async () => {
      const response = await paymentEndpoints.verifyPayment(reference)
      
      // Invalidate payment history
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      
      // Show success message based on status
      if (response.data.status === 'completed') {
        toast.success('Payment successful!')
      } else if (response.data.status === 'failed') {
        toast.error('Payment failed. Please try again.')
      }
      
      return response
    },
    enabled: !!reference,
    retry: 3, // Retry up to 3 times for verification
    retryDelay: 1000, // Wait 1 second between retries
  })
}

/**
 * Hook to get a specific payment by ID
 */
export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: paymentKeys.detail(paymentId),
    queryFn: () => paymentEndpoints.getPaymentById(paymentId),
    enabled: !!paymentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get payment history
 */
export function usePaymentHistory(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: paymentKeys.list(page),
    queryFn: () => paymentEndpoints.getPaymentHistory(page, limit),
    staleTime: 60 * 1000, // 1 minute
  })
}
