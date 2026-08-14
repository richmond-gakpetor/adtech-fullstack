// ============= Billboard Types =============

export interface Coordinates {
  lat: number
  lng: number
}

export interface Billboard {
  id: string
  title: string
  description: string
  location: string
  fullAddress?: string | null
  coordinates: Coordinates
  billboardType: 'Digital' | 'Static'
  widthFt: number
  heightFt: number
  orientation?: string | null  // Horizontal, Vertical, Square
  illumination?: string | null  // Lit, Unlit, Backlit
  images: string[]
  isAvailable: boolean
  isActive: boolean
  views: number
  weeklyRate: number
  monthlyRate?: number | null
  printingFee?: number | null  // For static billboards
  flightFee?: number | null    // For static billboards
  minimumDuration?: string | null  // Minimum rental duration (e.g., "1 week")
  features: string[]  // Billboard features
  nearbyLandmarks: string[]  // Nearby landmarks
  availableFrom?: string | null  // Availability start date
  availableTo?: string | null  // Availability end date
  ownerId: string
  owner?: {
    id: string
    fullName: string
    phoneNumber?: string | null
    companyName?: string | null
    bio?: string | null
    profileImage?: string | null
    userType: 'owner' | 'advertiser' | 'admin'
  }
  isSaved?: boolean
  totalSaves?: number
  contactName?: string | null
  contactPhone?: string | null
  createdAt: string
  updatedAt?: string
}

export interface BillboardFilters {
  location?: string
  billboardType?: 'Digital' | 'Static'
  isAvailable?: boolean
  minWeeklyRate?: number
  maxWeeklyRate?: number
  minMonthlyRate?: number
  maxMonthlyRate?: number
  minViews?: number
  search?: string
  ownerId?: string
  // Proximity search (for location-based filtering)
  nearLat?: number
  nearLng?: number
  radiusKm?: number
}

export interface BillboardCreateInput {
  title: string
  description: string
  location: string
  fullAddress?: string | null
  coordinates: Coordinates
  billboardType: 'Digital' | 'Static'
  widthFt: number
  heightFt: number
  orientation?: string | null
  illumination?: string | null
  weeklyRate: number
  monthlyRate?: number | null
  printingFee?: number | null
  flightFee?: number | null
  minimumDuration?: string | null
  features?: string[]
  nearbyLandmarks?: string[]
  availableFrom?: string | null
  availableTo?: string | null
  images?: string[]
  contactName?: string | null
  contactPhone?: string | null
}

export type BillboardUpdateInput = Partial<BillboardCreateInput>

export type ViewMode = 'grid' | 'list' | 'map'

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}
