/**
 * Billboard API Endpoints
 * Billboard browsing, CRUD, and interaction endpoints
 */

import apiClient from '../index';
import type {
  ApiResponse,
  PaginatedResponse,
  Billboard,
  BillboardFilters,
  BillboardCreateInput,
  BillboardUpdateInput,
  BillboardListingStatus,
} from '@/lib/types';

// Transform functions for snake_case <-> camelCase
const toCamelCase = (data: any): Billboard => ({
  id: data.id,
  title: data.title,
  description: data.description,
  location: data.location,
  fullAddress: data.full_address,
  coordinates: data.coordinates,
  billboardType: data.billboard_type,
  widthFt: data.width_ft,
  heightFt: data.height_ft,
  orientation: data.orientation,
  illumination: data.illumination,
  images: data.images || [],
  isAvailable: data.is_available,
  isActive: data.is_active,
  views: data.views,
  weeklyRate: data.weekly_rate,
  monthlyRate: data.monthly_rate,
  printingFee: data.printing_fee,
  flightFee: data.flight_fee,
  minimumDuration: data.minimum_duration,
  features: data.features || [],
  nearbyLandmarks: data.nearby_landmarks || [],
  availableFrom: data.available_from,
  availableTo: data.available_to,
  ownerId: data.owner_id,
  owner: data.owner ? {
    id: data.owner.id,
    fullName: data.owner.full_name,
    phoneNumber: data.owner.phone_number,
    companyName: data.owner.company_name,
    bio: data.owner.bio,
    profileImage: data.owner.profile_image,
    userType: data.owner.user_type,
  } : undefined,
  isSaved: data.is_saved,
  totalSaves: data.total_saves,
  contactName: data.contact_name,
  contactPhone: data.contact_phone,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const toSnakeCase = (data: BillboardCreateInput | BillboardUpdateInput) => {
  return {
    title: data.title,
    description: data.description,
    location: data.location,
    full_address: data.fullAddress,
    coordinates: data.coordinates,
    billboard_type: data.billboardType,
    width_ft: data.widthFt,
    height_ft: data.heightFt,
    orientation: data.orientation,
    illumination: data.illumination,
    weekly_rate: data.weeklyRate,
    monthly_rate: data.monthlyRate,
    printing_fee: data.printingFee,
    flight_fee: data.flightFee,
    minimum_duration: data.minimumDuration,
    features: data.features || [],
    nearby_landmarks: data.nearbyLandmarks || [],
    available_from: data.availableFrom,
    available_to: data.availableTo,
    images: data.images || [],
    contact_name: data.contactName,
    contact_phone: data.contactPhone,
  };
};

const transformFilters = (filters: BillboardFilters) => ({
  location: filters.location,
  type: filters.billboardType,
  availability: filters.isAvailable !== undefined ? (filters.isAvailable ? 'available' : 'unavailable') : undefined,
  min_weekly_rate: filters.minWeeklyRate,
  max_weekly_rate: filters.maxWeeklyRate,
  min_monthly_rate: filters.minMonthlyRate,
  max_monthly_rate: filters.maxMonthlyRate,
  min_views: filters.minViews,
  search: filters.search,
  owner_id: filters.ownerId,
  // Proximity search parameters
  near_lat: filters.nearLat,
  near_lng: filters.nearLng,
  radius_km: filters.radiusKm,
});

export const billboardEndpoints = {
  /**
   * Browse billboards with filters and pagination
   */
  browse: async (
    filters: BillboardFilters,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<Billboard>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(transformFilters(filters))
          .filter(([_, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      ),
    });

    const response = await apiClient.get(`/billboards?${params}`);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        items: response.data.data.items.map(toCamelCase),
      },
    };
  },

  /**
   * Get billboard by ID
   */
  getById: async (id: string): Promise<ApiResponse<Billboard>> => {
    const response = await apiClient.get(`/billboards/${id}`);
    return {
      ...response.data,
      data: toCamelCase(response.data.data),
    };
  },

  /**
   * Create a new billboard (owner only)
   */
  create: async (data: BillboardCreateInput): Promise<ApiResponse<Billboard>> => {
    const response = await apiClient.post('/billboards', toSnakeCase(data));
    return {
      ...response.data,
      data: toCamelCase(response.data.data),
    };
  },

  /**
   * Create a billboard on behalf of an owner (admin only)
   */
  adminCreate: async (data: BillboardCreateInput): Promise<ApiResponse<Billboard>> => {
    const response = await apiClient.post('/admin/billboards', toSnakeCase(data));
    return {
      ...response.data,
      data: toCamelCase(response.data.data),
    };
  },

  /**
   * Update billboard (owner only)
   */
  update: async (
    id: string,
    data: BillboardUpdateInput
  ): Promise<ApiResponse<Billboard>> => {
    const response = await apiClient.patch(`/billboards/${id}`, toSnakeCase(data));
    return {
      ...response.data,
      data: toCamelCase(response.data.data),
    };
  },

  /**
   * Delete billboard (owner only, soft delete)
   */
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/billboards/${id}`);
    return response.data;
  },

  /**
   * Increment view count
   */
  incrementViews: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post(`/billboards/${id}/view`);
    return response.data;
  },

  /**
   * Save/bookmark a billboard
   */
  save: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post(`/billboards/${id}/save`);
    return response.data;
  },

  /**
   * Unsave/unbookmark a billboard
   */
  unsave: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/billboards/${id}/save`);
    return response.data;
  },

  /**
   * Get saved billboards
   */
  getSaved: async (page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Billboard>>> => {
    const response = await apiClient.get(`/billboards/saved/list?page=${page}&limit=${limit}`);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        items: response.data.data.items.map(toCamelCase),
      },
    };
  },

  /**
   * Get my billboards (owner only)
   */
  getMyBillboards: async (
    page = 1,
    limit = 20
  ): Promise<ApiResponse<PaginatedResponse<Billboard>>> => {
    const response = await apiClient.get(`/billboards/owner/my-billboards?page=${page}&limit=${limit}`);
    return {
      ...response.data,
      data: {
        ...response.data.data,
        items: response.data.data.items.map(toCamelCase),
      },
    };
  },

  /**
   * Get listing status for a billboard (owner only)
   */
  getListingStatus: async (id: string): Promise<ApiResponse<BillboardListingStatus>> => {
    const response = await apiClient.get(`/billboards/${id}/listing-status`);
    const data = response.data;
    
    // Transform snake_case to camelCase
    if (data.success && data.data) {
      return {
        success: data.success,
        data: {
          billboardId: data.data.billboard_id,
          hasActiveListing: data.data.has_active_listing,
          accessStartsAt: data.data.access_starts_at,
          accessExpiresAt: data.data.access_expires_at,
          daysRemaining: data.data.days_remaining,
          isExpired: data.data.is_expired,
          isInGracePeriod: data.data.is_in_grace_period,
          gracePeriodExpiresAt: data.data.grace_period_expires_at,
          canRenew: data.data.can_renew,
          currentTier: data.data.current_tier ? {
            tierId: data.data.current_tier.tier_id,
            durationDays: data.data.current_tier.duration_days,
            priceGhs: data.data.current_tier.price_ghs,
            accessStartsAt: data.data.current_tier.access_starts_at,
            accessExpiresAt: data.data.current_tier.access_expires_at,
            isActive: data.data.current_tier.is_active,
          } : null,
        },
        message: data.message,
      };
    }
    
    return data;
  },
};
