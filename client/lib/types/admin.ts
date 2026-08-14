/**
 * Admin Types
 * Types for admin dashboard, user management, and RBAC
 */

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalOwners: number
  totalAdvertisers: number
  totalAdmins: number
  totalBillboards: number
  activeBillboards: number
  totalReviews: number
  totalPayments: number
  totalRevenueGhs: number
}

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  userType: 'owner' | 'advertiser' | 'admin'
  isActive: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
  // Email verification
  emailVerified: boolean
  emailVerifiedAt: string | null
  // KYC fields (for owners)
  kycStatus: KYCStatus | null
  kycSubmissionCount: number
  kycSubmittedAt: string | null
  kycReviewedAt: string | null
  kycRejectionReason: string | null
  // Statistics
  billboardCount: number
  reviewCount: number
}

export interface AdminUserListResponse {
  users: AdminUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UserStatusUpdate {
  isActive?: boolean
  isVerified?: boolean
}

export interface UserTypeChangeRequest {
  userType: 'owner' | 'advertiser' | 'admin'
}

export interface AdminPermissions {
  userId: string
  userType: string
  permissions: string[]
}

export interface AdminUserFilters {
  userType?: 'owner' | 'advertiser' | 'admin'
  isActive?: boolean
  isVerified?: boolean
  search?: string
  page?: number
  pageSize?: number
}

// KYC Types
export type KYCStatus = 'pending' | 'submitted' | 'approved' | 'rejected'

export interface KYCUser extends AdminUser {
  kycStatus: KYCStatus
  kycSubmissionCount: number
  kycSubmittedAt: string | null
  kycReviewedAt: string | null
  kycRejectionReason: string | null
  emailVerified: boolean
  emailVerifiedAt: string | null
  canListBillboards: boolean
  needsEmailVerification: boolean
  needsKyc: boolean
  kycUnderReview: boolean
}

export interface KYCReview {
  approved: boolean
  rejectionReason?: string
  notes?: string
}

export interface KYCUserFilters {
  kycStatus?: KYCStatus
  page?: number
  pageSize?: number
}

// Scheduler Types
export interface SchedulerStatus {
  running: boolean
  jobCount: number
  jobs: SchedulerJob[]
}

export interface SchedulerJob {
  id: string
  name: string
  nextRunTime: string | null
  trigger: string
}

export interface ReminderStats {
  totalChecked: number
  remindersSent: number
  billboardsProcessed: number
  errors: number
}

export interface ManualReminderRequest {
  billboardId: string
}
