/**
 * Admin API Endpoints
 * Admin dashboard, user management, and RBAC operations
 */

import apiClient from '../index'
import type { ApiResponse } from '@/lib/types'
import type { 
  AdminStats, 
  AdminUser, 
  AdminUserListResponse, 
  UserStatusUpdate, 
  UserTypeChangeRequest,
  AdminPermissions,
  AdminUserFilters
} from '@/lib/types/admin'

// Transform snake_case to camelCase for nested objects
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      acc[camelKey] = toCamelCase(obj[key])
      return acc
    }, {} as any)
  }
  
  return obj
}

// Transform camelCase to snake_case
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      acc[snakeKey] = toSnakeCase(obj[key])
      return acc
    }, {} as any)
  }
  
  return obj
}

export const adminEndpoints = {
  /**
   * Get platform statistics
   */
  getPlatformStats: async (): Promise<ApiResponse<AdminStats>> => {
    const response = await apiClient.get('/admin/stats')
    return {
      ...response.data,
      data: toCamelCase(response.data.data)
    }
  },

  /**
   * Get paginated list of users with filters
   */
  getUsers: async (filters: AdminUserFilters = {}): Promise<ApiResponse<AdminUserListResponse>> => {
    const params = toSnakeCase(filters)
    const response = await apiClient.get('/admin/users', { params })
    // Backend returns data directly without wrapping in data property
    return {
      data: toCamelCase(response.data)
    }
  },

  /**
   * Get detailed user information
   */
  getUserById: async (userId: string): Promise<ApiResponse<AdminUser>> => {
    const response = await apiClient.get(`/admin/users/${userId}`)
    return {
      ...response.data,
      data: toCamelCase(response.data.data)
    }
  },

  /**
   * Update user status (active/verified)
   */
  updateUserStatus: async (
    userId: string, 
    status: UserStatusUpdate
  ): Promise<ApiResponse<AdminUser>> => {
    const response = await apiClient.patch(
      `/admin/users/${userId}/status`,
      toSnakeCase(status)
    )
    return {
      ...response.data,
      data: toCamelCase(response.data.data)
    }
  },

  /**
   * Change user type
   */
  changeUserType: async (
    userId: string, 
    typeChange: UserTypeChangeRequest
  ): Promise<ApiResponse<AdminUser>> => {
    const response = await apiClient.patch(
      `/admin/users/${userId}/type`,
      toSnakeCase(typeChange)
    )
    return {
      ...response.data,
      data: toCamelCase(response.data.data)
    }
  },

  /**
   * Delete user (soft delete)
   */
  deleteUser: async (userId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/admin/users/${userId}`)
    return response.data
  },

  /**
   * Get current admin's permissions
   */
  getAdminPermissions: async (): Promise<ApiResponse<AdminPermissions>> => {
    const response = await apiClient.get('/admin/permissions')
    return {
      ...response.data,
      data: toCamelCase(response.data.data)
    }
  },

  /**
   * Review KYC submission
   */
  reviewKYC: async (
    userId: string,
    review: { approved: boolean; rejectionReason?: string; notes?: string }
  ): Promise<ApiResponse<any>> => {
    // Convert approved boolean to action string for backend
    const backendReview = {
      action: review.approved ? 'approve' : 'reject',
      rejection_reason: review.rejectionReason,
      notes: review.notes,
    }
    
    const response = await apiClient.put(
      `/admin/users/${userId}/kyc`,
      backendReview
    )
    return {
      ...response.data,
      data: toCamelCase(response.data.data || response.data)
    }
  },

  /**
   * Get scheduler status
   */
  getSchedulerStatus: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/admin/scheduler/status')
    return {
      ...response.data,
      data: toCamelCase(response.data.data)
    }
  },

  /**
   * Manually trigger reminder check
   */
  triggerReminderCheck: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/admin/reminders/trigger')
    return {
      ...response.data,
      data: toCamelCase(response.data.data)
    }
  },

  /**
   * Manually trigger billboard views increment
   */
  triggerViewsIncrement: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/admin/views/trigger')
    return {
      ...response.data,
      data: toCamelCase(response.data.data)
    }
  },

  /**
   * Admin override: mark KYC as submitted for a user who completed the
   * external Google Form but did not return to confirm on the platform.
   */
  markKYCSubmitted: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/admin/users/${userId}/kyc/mark-submitted`)
    return {
      ...response.data,
      data: toCamelCase(response.data.data || response.data),
    }
  },

  /**
   * Send manual reminder for specific billboard
   */
  sendManualReminder: async (billboardId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/admin/reminders/send/${billboardId}`)
    return response.data
  },
}
