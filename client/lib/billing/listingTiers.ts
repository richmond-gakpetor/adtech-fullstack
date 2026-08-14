// TODO:update the listing tier to match the backend config
export type ListingTierId = "7d" | "14d"

export interface ListingTier {
  id: ListingTierId
  label: string
  priceGhs: number
  durationDays: number
}

export const LISTING_GRACE_DAYS = 3

export const LISTING_TIERS: ListingTier[] = [
  { id: "7d", label: "14 days", priceGhs: 70, durationDays: 14 },
  { id: "14d", label: "30 days", priceGhs: 110, durationDays: 30 },
]

export const getListingTier = (tierId: string | null | undefined): ListingTier | null => {
  if (!tierId) return null
  return LISTING_TIERS.find((t) => t.id === tierId) ?? null
}
