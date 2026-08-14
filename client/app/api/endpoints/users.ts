import apiClient from '../index'
import type { 
  User, 
  UserUpdateInput, 
  PasswordChange,
  VerificationStatus,
  KYCSubmission,
} from '@/lib/types/user'
import type { ApiResponse } from '@/lib/types'

// Helper: Convert camelCase to snake_case for API requests
const toSnakeCase = (data: UserUpdateInput): Record<string, any> => {
  const result: Record<string, any> = {};
  
  // Handle fullName -> first_name and last_name
  if (data.fullName) {
    const nameParts = data.fullName.trim().split(/\s+/);
    result.first_name = nameParts[0] || '';
    result.last_name = nameParts.slice(1).join(' ') || nameParts[0] || '';
  }
  
  if (data.phone !== undefined) result.phone_number = data.phone;
  if (data.companyName !== undefined) result.company_name = data.companyName;
  if (data.bio !== undefined) result.bio = data.bio;
  
  return result;
};

// Transform User from snake_case to camelCase
const transformUser = (data: any): User => ({
  id: data.id,
  email: data.email,
  fullName: data.first_name && data.last_name 
    ? `${data.first_name} ${data.last_name}`.trim() 
    : data.full_name || '',
  phone: data.phone_number || data.phone,
  userType: data.user_type,
  companyName: data.company_name,
  bio: data.bio,
  profileImage: data.profile_image,
  isVerified: data.is_verified,
  emailVerified: data.email_verified || false,
  kycStatus: data.kyc_status || 'pending',
  needsEmailVerification: data.needs_email_verification || false,
  needsKyc: data.needs_kyc || false,
  canListBillboards: data.can_list_billboards !== undefined ? data.can_list_billboards : true,
  kycUnderReview: data.kyc_under_review || false,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

/**
 * Get current authenticated user profile
 */
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  const response = await apiClient.get<ApiResponse<any>>('/users/me')
  
  return {
    ...response.data,
    data: transformUser(response.data.data),
  }
}

/**
 * Update current user profile
 */
export const updateProfile = async (data: UserUpdateInput): Promise<ApiResponse<User>> => {
  const snakeData = toSnakeCase(data)
  const response = await apiClient.patch<ApiResponse<any>>('/users/me', snakeData)
  
  return {
    ...response.data,
    data: transformUser(response.data.data),
  }
}

/**
 * Change password
 */
export const changePassword = async (data: PasswordChange): Promise<ApiResponse<{ message: string }>> => {
  const snakeData = {
    current_password: data.currentPassword,
    new_password: data.newPassword,
  };
  const response = await apiClient.post<ApiResponse<{ message: string }>>('/users/me/change-password', snakeData)
  return response.data
}

/**
 * Upload profile image
 */
export const uploadProfileImage = async (file: File): Promise<ApiResponse<{ url: string }>> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await apiClient.post<ApiResponse<{ url: string }>>(
    '/users/me/profile-image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  
  return response.data
}

/**
 * Get public user profile by ID
 */
export const getUserById = async (userId: string): Promise<ApiResponse<User>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/users/${userId}/profile`)
  
  return {
    ...response.data,
    data: transformUser(response.data.data),
  }
}

/**
 * Get user's public billboards (for owner profile pages)
 */
export const getUserBillboards = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/users/${userId}/billboards`, {
    params: { page, limit },
  })
  
  return response.data
}

/**
 * Get current user's verification status
 */
export const getVerificationStatus = async (): Promise<ApiResponse<VerificationStatus>> => {
  const response = await apiClient.get<ApiResponse<any>>('/users/me/verification-status')
  
  return {
    ...response.data,
    data: {
      emailVerified: response.data.data.email_verified,
      kycStatus: response.data.data.kyc_status,
      needsEmailVerification: response.data.data.needs_email_verification,
      needsKyc: response.data.data.needs_kyc,
      canListBillboards: response.data.data.can_list_billboards,
      kycUnderReview: response.data.data.kyc_under_review,
    },
  }
}

/**
 * Get KYC form URL with prefilled email
 */
export const getKYCFormUrl = async (): Promise<ApiResponse<{ formUrl: string }>> => {
  const response = await apiClient.get<ApiResponse<{ form_url: string }>>('/users/me/kyc-form-url')
  
  return {
    ...response.data,
    data: { formUrl: response.data.data.form_url },
  }
}

/**
 * Submit KYC confirmation
 */
export const submitKYC = async (data: KYCSubmission): Promise<ApiResponse<VerificationStatus>> => {
  const response = await apiClient.post<ApiResponse<any>>('/users/me/submit-kyc', data)
  
  return {
    ...response.data,
    data: {
      emailVerified: response.data.data.email_verified,
      kycStatus: response.data.data.kyc_status,
      needsEmailVerification: response.data.data.needs_email_verification,
      needsKyc: response.data.data.needs_kyc,
      canListBillboards: response.data.data.can_list_billboards,
      kycUnderReview: response.data.data.kyc_under_review,
    },
  }
}

// Export all endpoints
export const userEndpoints = {
  getCurrentUser,
  updateProfile,
  changePassword,
  uploadProfileImage,
  getUserById,
  getUserBillboards,
  getVerificationStatus,
  getKYCFormUrl,
  submitKYC,
}
