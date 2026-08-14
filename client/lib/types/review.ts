// ============= Review Types =============

export interface Review {
  id: string
  reviewerId: string
  reviewerName: string
  reviewerImage?: string | null
  reviewType: 'billboard' | 'owner' | 'advertiser'
  billboardId?: string | null
  revieweeId?: string | null
  rating: number
  title: string
  comment: string
  helpfulCount: number
  isHelpful: boolean
  createdAt: string
  updatedAt: string
}

export interface ReviewCreateInput {
  reviewType: 'billboard' | 'owner' | 'advertiser'
  billboardId?: string
  revieweeId?: string
  rating: number
  title: string
  comment: string
}

export interface ReviewUpdateInput {
  rating?: number
  title?: string
  comment?: string
}

export interface ReviewSummary {
  averageRating: number | null
  totalReviews: number
  ratingDistribution: {
    '1': number
    '2': number
    '3': number
    '4': number
    '5': number
  }
}
