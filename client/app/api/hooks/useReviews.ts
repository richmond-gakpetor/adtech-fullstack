import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewEndpoints } from '../endpoints/reviews'
import type { ReviewCreateInput, ReviewUpdateInput } from '@/lib/types/review'
import { toast } from 'sonner'

// Query keys
export const reviewKeys = {
  all: ['reviews'] as const,
  billboard: (id: string) => [...reviewKeys.all, 'billboard', id] as const,
  billboardList: (id: string, page: number) => [...reviewKeys.billboard(id), { page }] as const,
  billboardSummary: (id: string) => [...reviewKeys.billboard(id), 'summary'] as const,
  user: (id: string) => [...reviewKeys.all, 'user', id] as const,
  userList: (id: string, page: number) => [...reviewKeys.user(id), { page }] as const,
  userSummary: (id: string) => [...reviewKeys.user(id), 'summary'] as const,
  my: () => [...reviewKeys.all, 'my'] as const,
  myList: (page: number) => [...reviewKeys.my(), { page }] as const,
  allList: (page: number, filters?: any) => [...reviewKeys.all, 'list', { page, filters }] as const,
  allSummary: () => [...reviewKeys.all, 'summary'] as const,
}

/**
 * Hook to create a review
 */
export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReviewCreateInput) => reviewEndpoints.createReview(data),
    onSuccess: (response, variables) => {
      // Invalidate relevant queries
      if (variables.billboardId) {
        queryClient.invalidateQueries({ queryKey: reviewKeys.billboard(variables.billboardId) })
      }
      if (variables.revieweeId) {
        queryClient.invalidateQueries({ queryKey: reviewKeys.user(variables.revieweeId) })
      }
      queryClient.invalidateQueries({ queryKey: reviewKeys.my() })
      
      toast.success(response.message || 'Review submitted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit review')
    },
  })
}

/**
 * Hook to update a review
 */
export function useUpdateReview(reviewId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReviewUpdateInput) => reviewEndpoints.updateReview(reviewId, data),
    onSuccess: (response) => {
      // Invalidate all review queries (we don't know which lists this review is in)
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      
      toast.success(response.message || 'Review updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update review')
    },
  })
}

/**
 * Hook to delete a review
 */
export function useDeleteReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reviewId: string) => reviewEndpoints.deleteReview(reviewId),
    onSuccess: (response) => {
      // Invalidate all review queries
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      
      toast.success(response.message || 'Review deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete review')
    },
  })
}

/**
 * Hook to get reviews for a billboard
 */
export function useBillboardReviews(billboardId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: reviewKeys.billboardList(billboardId, page),
    queryFn: () => reviewEndpoints.getBillboardReviews(billboardId, page, limit),
    enabled: !!billboardId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to get reviews for a user
 */
export function useUserReviews(userId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: reviewKeys.userList(userId, page),
    queryFn: () => reviewEndpoints.getUserReviews(userId, page, limit),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/** * Hook to get review summary for a billboard
 */
export function useBillboardReviewSummary(billboardId: string) {
  return useQuery({
    queryKey: reviewKeys.billboardSummary(billboardId),
    queryFn: () => reviewEndpoints.getBillboardReviewSummary(billboardId),
    enabled: !!billboardId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to get review summary for a user (owner or advertiser)
 */
export function useUserReviewSummary(userId: string) {
  return useQuery({
    queryKey: reviewKeys.userSummary(userId),
    queryFn: () => reviewEndpoints.getUserReviewSummary(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/** * Hook to get current user's reviews
 */
export function useMyReviews(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: reviewKeys.myList(page),
    queryFn: () => reviewEndpoints.getMyReviews(page, limit),
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to mark/unmark review as helpful
 */
export function useToggleReviewHelpful() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reviewId, isHelpful }: { reviewId: string; isHelpful: boolean }) => {
      return isHelpful
        ? reviewEndpoints.unmarkReviewHelpful(reviewId)
        : reviewEndpoints.markReviewHelpful(reviewId)
    },
    onMutate: async ({ reviewId, isHelpful }) => {
      // Optimistically update the UI
      // We don't know which query contains this review, so we update all
      await queryClient.cancelQueries({ queryKey: reviewKeys.all })
    },
    onSuccess: () => {
      // Invalidate all review queries to refetch
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update')
    },
  })
}

/**
 * Hook to get all reviews with filters
 */
export function useAllReviews(
  page: number = 1,
  limit: number = 20,
  filters?: {
    rating?: number
    reviewType?: 'billboard' | 'owner' | 'advertiser'
    search?: string
  }
) {
  return useQuery({
    queryKey: reviewKeys.allList(page, filters),
    queryFn: () => reviewEndpoints.getAllReviews(page, limit, filters),
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to get overall review summary (all reviews)
 */
export function useAllReviewsSummary() {
  return useQuery({
    queryKey: reviewKeys.allSummary(),
    queryFn: () => reviewEndpoints.getAllReviewsSummary(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
