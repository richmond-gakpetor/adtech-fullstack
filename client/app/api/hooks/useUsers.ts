import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userEndpoints } from '../endpoints/users'
import type { UserUpdateInput, PasswordChange } from '@/lib/types/user'
import { toast } from 'sonner'

export const userKeys = {
  all: ['users'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  billboards: (id: string) => [...userKeys.all, id, 'billboards'] as const,
}


export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: userEndpoints.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}


export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UserUpdateInput) => userEndpoints.updateProfile(data),
    onSuccess: (response) => {
      // Invalidate current user query
      queryClient.invalidateQueries({ queryKey: userKeys.current() })
      
      toast.success(response.message || 'Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    },
  })
}


export function useChangePassword() {
  return useMutation({
    mutationFn: (data: PasswordChange) => userEndpoints.changePassword(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Password changed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password')
    },
  })
}


export function useUploadProfileImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => userEndpoints.uploadProfileImage(file),
    onSuccess: (response) => {
      // Invalidate current user query to refetch with new image
      queryClient.invalidateQueries({ queryKey: userKeys.current() })
      
      toast.success('Profile image updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload image')
    },
  })
}


export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userEndpoints.getUserById(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}


export function useUserBillboards(userId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: [...userKeys.billboards(userId), { page, limit }],
    queryFn: () => userEndpoints.getUserBillboards(userId, page, limit),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  })
}
