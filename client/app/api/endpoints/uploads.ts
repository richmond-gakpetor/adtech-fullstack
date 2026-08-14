/**
 * Upload API Endpoints
 * File upload endpoints for S3
 */

import apiClient from '../index';
import type { ApiResponse, MultiUploadResponse } from '@/lib/types';

export const uploadEndpoints = {
  /**
   * Upload billboard images
   */
  uploadBillboardImages: async (
    files: File[],
    billboardId: string
  ): Promise<ApiResponse<MultiUploadResponse>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('billboard_id', billboardId);

    const response = await apiClient.post('/uploads/billboard-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
