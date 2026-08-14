// ============= Base API Response Types =============

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface AuthResponse {
  user: User
  tokens: {
    accessToken: string
    refreshToken: string
    tokenType: string
  }
}

export interface MultiUploadResponse {
  urls: string[]
  count: number
}

// ============= Re-exports =============

export * from './billboard'
export * from './user'
export * from './payment'
export * from './review'
export * from './admin'

// Import for AuthResponse type
import type { User } from './user'
