import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminEndpoints } from '../endpoints/admin'
import type { UserStatusUpdate, UserTypeChangeRequest, AdminUserFilters } from '@/lib/types/admin'
import { toast } from 'sonner'
import { billboardKeys } from './useBillboards'

// Query keys
export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  userList: (filters: AdminUserFilters) => [...adminKeys.users(), filters] as const,
  userDetail: (id: string) => [...adminKeys.users(), id] as const,
  permissions: () => [...adminKeys.all, 'permissions'] as const,
}

/**
 * Hook to get platform statistics
 */
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => adminEndpoints.getPlatformStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get paginated users with filters
 */
export function useAdminUsers(filters: AdminUserFilters = {}) {
  return useQuery({
    queryKey: adminKeys.userList(filters),
    queryFn: () => adminEndpoints.getUsers(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to get detailed user information
 */
export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: adminKeys.userDetail(userId),
    queryFn: () => adminEndpoints.getUserById(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to update user status
 */
export function useUpdateUserStatus(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: UserStatusUpdate) => adminEndpoints.updateUserStatus(userId, status),
    onSuccess: (response) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() })
      
      toast.success(response.message || 'User status updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user status')
    },
  })
}

/**
 * Hook to change user type
 */
export function useChangeUserType(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (typeChange: UserTypeChangeRequest) => 
      adminEndpoints.changeUserType(userId, typeChange),
    onSuccess: (response) => {
      // Invalidate user queries and stats
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() })
      
      toast.success(response.message || 'User type changed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change user type')
    },
  })
}

/**
 * Hook to delete user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => adminEndpoints.deleteUser(userId),
    onSuccess: (response) => {
      // Invalidate user queries and stats
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() })
      
      toast.success(response.message || 'User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    },
  })
}

/**
 * Hook to get current admin's permissions
 */
export function useAdminPermissions() {
  return useQuery({
    queryKey: adminKeys.permissions(),
    queryFn: () => adminEndpoints.getAdminPermissions(),
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions rarely change
  })
}

/**
 * Hook to review KYC submission
 */
export function useReviewKYC() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, review }: { 
      userId: string; 
      review: { approved: boolean; rejectionReason?: string; notes?: string } 
    }) => adminEndpoints.reviewKYC(userId, review),
    onSuccess: (response) => {
      // Invalidate user queries to refresh KYC status
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() })
      
      toast.success(response.message || 'KYC review completed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to review KYC')
    },
  })
}

/**
 * Hook to get scheduler status
 */
export function useSchedulerStatus() {
  return useQuery({
    queryKey: [...adminKeys.all, 'scheduler', 'status'] as const,
    queryFn: () => adminEndpoints.getSchedulerStatus(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

/**
 * Hook to trigger reminder check
 */
export function useTriggerReminderCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => adminEndpoints.triggerReminderCheck(),
    onSuccess: (response) => {
      // Invalidate scheduler status
      queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'scheduler'] })
      
      const data = response.data
      const message = data 
        ? `Reminders sent: ${data.remindersSent || 0}, Billboards checked: ${data.totalChecked || 0}`
        : 'Reminder check triggered successfully'
      
      toast.success(message)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to trigger reminder check')
    },
  })
}

/**
 * Hook to trigger billboard views increment
 */
export function useTriggerViewsIncrement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => adminEndpoints.triggerViewsIncrement(),
    onSuccess: (response) => {
      const updated = response.data?.billboardsUpdated ?? 0
      toast.success(`Views increment complete. ${updated} billboard${updated !== 1 ? 's' : ''} updated.`)
      // Invalidate billboard lists so the UI reflects updated view counts
      queryClient.invalidateQueries({ queryKey: billboardKeys.lists() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to trigger views increment')
    },
  })
}

/**
 * Hook to send manual reminder for specific billboard
 */
export function useSendManualReminder() {
  return useMutation({
    mutationFn: (billboardId: string) => adminEndpoints.sendManualReminder(billboardId),
    onSuccess: (response, billboardId) => {
      toast.success(`Reminder sent for billboard ${billboardId}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send manual reminder')
    },
  })
}

/**
 * Hook for admin to forcefully mark a user's KYC as submitted.
 * Use when the user completed the external Google Form but did not return
 * to the platform to confirm their submission.
 */
export function useMarkKYCSubmitted() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => adminEndpoints.markKYCSubmitted(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() })
      toast.success('KYC marked as submitted — user now appears in the review queue')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to mark KYC as submitted')
    },
  })
}
