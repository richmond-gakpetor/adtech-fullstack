import apiClient from "../index"

export interface PublicConfig {
  require_payment_for_visibility: boolean
  promotional_listing_days: number
  listing_grace_days: number
}

export const configEndpoints = {
  /**
   * Get public configuration from backend
   * Determines if payment is required for listing visibility
   */
  getPublicConfig: async (): Promise<PublicConfig> => {
    const response = await apiClient.get<{ data: PublicConfig }>("/config/public-config")
    return response.data.data
  },
}
