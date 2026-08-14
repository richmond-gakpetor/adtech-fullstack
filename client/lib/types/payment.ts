// ============= Payment Types =============

export interface PaymentInitialize {
  authorizationUrl: string
  accessCode: string
  reference: string
}

export interface Payment {
  id: string
  userId: string
  billboardId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  paymentMethod: string
  reference: string
  createdAt: string
  updatedAt: string
}

export interface PaymentInitializeInput {
  billboardId: string
  tierId: string  // "7d" or "14d"
}

export interface ListingTierInfo {
  tierId: string
  durationDays: number
  priceGhs: number
  accessStartsAt?: string | null
  accessExpiresAt?: string | null
  isActive: boolean
}

export interface BillboardListingStatus {
  billboardId: string
  hasActiveListing: boolean
  accessStartsAt?: string | null
  accessExpiresAt?: string | null
  daysRemaining?: number | null
  isExpired: boolean
  isInGracePeriod: boolean
  gracePeriodExpiresAt?: string | null
  canRenew: boolean
  currentTier?: ListingTierInfo | null
}
