'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadEndpoints } from '../endpoints/uploads';


export function useUploadBillboardImages() {
  return useMutation({
    mutationFn: ({ files, billboardId }: { files: File[]; billboardId: string }) => 
      uploadEndpoints.uploadBillboardImages(files, billboardId),
    onSuccess: (response) => {
      toast.success(`Successfully uploaded ${response.data.count} image(s)`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to upload images';
      toast.error(message);
    },
  });
}
