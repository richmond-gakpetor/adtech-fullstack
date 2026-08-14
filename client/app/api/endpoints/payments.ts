import apiClient from '../index'
import type { 
  Payment,
  PaymentInitialize,
  PaymentInitializeInput,
} from '@/lib/types/payment'
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

// Transform payment from API
const transformPayment = (data: any): Payment => {
  return toCamelCase(data) as Payment
}

/**
 * Initialize a payment (Paystack)
 */
export const initializePayment = async (
  data: PaymentInitializeInput
): Promise<ApiResponse<PaymentInitialize>> => {
  const snakeData = toSnakeCase(data)
  const response = await apiClient.post<ApiResponse<any>>('/payments/initialize', snakeData)
  
  return {
    ...response.data,
    data: toCamelCase(response.data.data) as PaymentInitialize,
  }
}

/**
 * Verify a payment after callback
 */
export const verifyPayment = async (reference: string): Promise<ApiResponse<Payment>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/payments/verify/${reference}`)
  
  return {
    ...response.data,
    data: transformPayment(response.data.data),
  }
}

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId: string): Promise<ApiResponse<Payment>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/payments/${paymentId}`)
  
  return {
    ...response.data,
    data: transformPayment(response.data.data),
  }
}

/**
 * Get user's payment history
 */
export const getPaymentHistory = async (
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<PaginatedResponse<Payment>>> => {
  const response = await apiClient.get<ApiResponse<any>>('/payments', {
    params: { page, limit },
  })
  
  return {
    ...response.data,
    data: {
      items: response.data.data.items.map(transformPayment),
      total: response.data.data.total,
      page: response.data.data.page,
      limit: response.data.data.limit,
      pages: response.data.data.pages,
    },
  }
}

// Export all endpoints
export const paymentEndpoints = {
  initializePayment,
  verifyPayment,
  getPaymentById,
  getPaymentHistory,
}
