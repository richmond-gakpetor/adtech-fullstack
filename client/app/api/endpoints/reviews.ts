import apiClient from '../index'
import type { 
  Review,
  ReviewCreateInput,
  ReviewUpdateInput,
  ReviewSummary,
} from '@/lib/types/review'
import type { ApiResponse, PaginatedResponse } from '@/lib/types'

// Helper: Convert camelCase to snake_case
const toSnakeCase = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue
    
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    result[snakeKey] = value
  }
  return result
}

// Helper: Convert snake_case to camelCase
const toCamelCase = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = value
      continue
    }
    
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    
    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[camelKey] = toCamelCase(value)
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map(item => 
        typeof item === 'object' && item !== null ? toCamelCase(item) : item
      )
    } else {
      result[camelKey] = value
    }
  }
  return result
}

// Transform review from API
const transformReview = (data: any): Review => {
  return toCamelCase(data) as Review
}

/**
 * Create a new review
 */
export const createReview = async (data: ReviewCreateInput): Promise<ApiResponse<Review>> => {
  const snakeData = toSnakeCase(data)
  const response = await apiClient.post<ApiResponse<any>>('/reviews', snakeData)
  
  return {
    ...response.data,
    data: transformReview(response.data.data),
  }
}

/**
 * Update an existing review
 */
export const updateReview = async (
  reviewId: string,
  data: ReviewUpdateInput
): Promise<ApiResponse<Review>> => {
  const snakeData = toSnakeCase(data)
  const response = await apiClient.patch<ApiResponse<any>>(`/reviews/${reviewId}`, snakeData)
  
  return {
    ...response.data,
    data: transformReview(response.data.data),
  }
}

/**
 * Delete a review
 */
export const deleteReview = async (reviewId: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/reviews/${reviewId}`)
  return response.data
}

/**
 * Get reviews for a billboard
 */
export const getBillboardReviews = async (
  billboardId: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<PaginatedResponse<Review>>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/reviews/billboard/${billboardId}`, {
    params: { page, limit },
  })
  
  return {
    ...response.data,
    data: {
      items: response.data.data.items.map(transformReview),
      total: response.data.data.total,
      page: response.data.data.page,
      limit: response.data.data.limit,
      pages: response.data.data.total_pages,
    },
  }
}

/**
 * Get reviews for a user (owner or advertiser)
 */
export const getUserReviews = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<PaginatedResponse<Review>>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/reviews/user/${userId}`, {
    params: { page, limit },
  })
  
  return {
    ...response.data,
    data: {
      items: response.data.data.items.map(transformReview),
      total: response.data.data.total,
      page: response.data.data.page,
      limit: response.data.data.limit,
      pages: response.data.data.total_pages,
    },
  }
}

/**
 * Get current user's reviews (reviews they've written)
 */
export const getMyReviews = async (
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<PaginatedResponse<Review>>> => {
  const response = await apiClient.get<ApiResponse<any>>('/reviews/me', {
    params: { page, limit },
  })
  
  return {
    ...response.data,
    data: {
      items: response.data.data.items.map(transformReview),
      total: response.data.data.total,
      page: response.data.data.page,
      limit: response.data.data.limit,
      pages: response.data.data.total_pages,
    },
  }
}

/**
 * Get review summary for a billboard
 */
export const getBillboardReviewSummary = async (
  billboardId: string
): Promise<ApiResponse<ReviewSummary>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/reviews/billboard/${billboardId}/summary`)
  
  return {
    ...response.data,
    data: {
      averageRating: response.data.data.average_rating,
      totalReviews: response.data.data.total_reviews,
      ratingDistribution: response.data.data.rating_distribution,
    },
  }
}

/**
 * Get review summary for a user (owner or advertiser)
 */
export const getUserReviewSummary = async (
  userId: string
): Promise<ApiResponse<ReviewSummary>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/reviews/user/${userId}/summary`)
  
  return {
    ...response.data,
    data: {
      averageRating: response.data.data.average_rating,
      totalReviews: response.data.data.total_reviews,
      ratingDistribution: response.data.data.rating_distribution,
    },
  }
}

/**
 * Mark a review as helpful
 */
export const markReviewHelpful = async (reviewId: string): Promise<ApiResponse<Review>> => {
  const response = await apiClient.post<ApiResponse<any>>(`/reviews/${reviewId}/helpful`)
  
  return {
    ...response.data,
    data: transformReview(response.data.data),
  }
}

/**
 * Unmark a review as helpful
 */
export const unmarkReviewHelpful = async (reviewId: string): Promise<ApiResponse<Review>> => {
  const response = await apiClient.delete<ApiResponse<any>>(`/reviews/${reviewId}/helpful`)
  
  return {
    ...response.data,
    data: transformReview(response.data.data),
  }
}

/**
 * Get all reviews with optional filters
 */
export const getAllReviews = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    rating?: number
    reviewType?: 'billboard' | 'owner' | 'advertiser'
    search?: string
  }
): Promise<ApiResponse<PaginatedResponse<Review>>> => {
  const params: any = { page, limit }
  
  if (filters?.rating) params.rating = filters.rating
  if (filters?.reviewType) params.review_type = filters.reviewType
  if (filters?.search) params.search = filters.search
  
  const response = await apiClient.get<ApiResponse<any>>('/reviews', { params })
  
  return {
    ...response.data,
    data: {
      items: response.data.data.items.map(transformReview),
      total: response.data.data.total,
      page: response.data.data.page,
      limit: response.data.data.limit,
      pages: response.data.data.total_pages,
    },
  }
}

/**
 * Get overall review summary (all reviews)
 */
export const getAllReviewsSummary = async (): Promise<ApiResponse<ReviewSummary>> => {
  const response = await apiClient.get<ApiResponse<any>>('/reviews/summary')
  
  return {
    ...response.data,
    data: {
      averageRating: response.data.data.average_rating,
      totalReviews: response.data.data.total_reviews,
      ratingDistribution: response.data.data.rating_distribution,
    },
  }
}

// Export all endpoints
export const reviewEndpoints = {
  createReview,
  updateReview,
  deleteReview,
  getBillboardReviews,
  getUserReviews,
  getMyReviews,
  getAllReviews,
  getBillboardReviewSummary,
  getUserReviewSummary,
  getAllReviewsSummary,
  markReviewHelpful,
  unmarkReviewHelpful,
}
