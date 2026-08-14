// ============= User Types =============

export type KYCStatus = 'pending' | 'submitted' | 'approved' | 'rejected'

export interface VerificationStatus {
  emailVerified: boolean
  kycStatus: KYCStatus
  needsEmailVerification: boolean
  needsKyc: boolean
  canListBillboards: boolean
  kycUnderReview: boolean
}

export interface User {
  id: string
  email: string
  fullName: string
  phone?: string | null
  userType: 'owner' | 'advertiser' | 'admin'
  companyName?: string | null
  bio?: string | null
  profileImage?: string | null
  isVerified: boolean
  emailVerified: boolean
  kycStatus: KYCStatus
  needsEmailVerification: boolean
  needsKyc: boolean
  canListBillboards: boolean
  kycUnderReview: boolean
  createdAt: string
  updatedAt: string
}

export interface UserCreateInput {
  email: string
  password: string
  fullName: string
  phone?: string | null
  userType: 'owner' | 'advertiser'
  companyName?: string | null
}

export interface UserUpdateInput {
  fullName?: string
  phone?: string | null
  companyName?: string | null
  bio?: string | null
}

export interface UserLogin {
  email: string
  password: string
}

export interface PasswordChange {
  currentPassword: string
  newPassword: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  newPassword: string
}

export interface EmailVerificationRequest {
  email: string
}

export interface KYCSubmission {
  confirmed: boolean
  notes?: string
}

export interface KYCReview {
  approved: boolean
  rejectionReason?: string
  notes?: string
}
