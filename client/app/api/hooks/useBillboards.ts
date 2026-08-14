/**
 * Billboard Hooks
 * React Query hooks for billboard operations
 */

'use client';

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billboardEndpoints } from '../endpoints/billboards';
import type {
  Billboard,
  BillboardFilters,
  BillboardCreateInput,
  BillboardUpdateInput,
} from '@/lib/types';

// Query Keys
export const billboardKeys = {
  all: ['billboards'] as const,
  lists: () => [...billboardKeys.all, 'list'] as const,
  list: (filters: BillboardFilters, page: number) => 
    [...billboardKeys.lists(), { filters, page }] as const,
  details: () => [...billboardKeys.all, 'detail'] as const,
  detail: (id: string) => [...billboardKeys.details(), id] as const,
  saved: () => [...billboardKeys.all, 'saved'] as const,
  myBillboards: () => [...billboardKeys.all, 'my-billboards'] as const,
};

/**
 * Hook to browse billboards with filters
 */
export function useBillboards(filters: BillboardFilters = {}, page = 1, limit = 20) {
  return useQuery({
    queryKey: billboardKeys.list(filters, page),
    queryFn: () => billboardEndpoints.browse(filters, page, limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for infinite scroll billboard browsing
 */
export function useInfiniteBillboards(filters: BillboardFilters = {}, limit = 20) {
  return useInfiniteQuery({
    queryKey: [...billboardKeys.lists(), filters],
    queryFn: ({ pageParam = 1 }) => billboardEndpoints.browse(filters, pageParam, limit),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Hook to get billboard details
 */
export function useBillboard(id: string, enabled = true) {
  return useQuery({
    queryKey: billboardKeys.detail(id),
    queryFn: () => billboardEndpoints.getById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a billboard
 */
export function useCreateBillboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BillboardCreateInput) => billboardEndpoints.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: billboardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: billboardKeys.myBillboards() });
      toast.success('Billboard created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create billboard';
      toast.error(message);
    },
  });
}

/**
 * Hook for admin to create a billboard on behalf of an owner
 */
export function useAdminCreateBillboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BillboardCreateInput) => billboardEndpoints.adminCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billboardKeys.lists() });
      toast.success('Billboard created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create billboard';
      toast.error(message);
    },
  });
}

/**
 * Hook to update a billboard
 */
export function useUpdateBillboard(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BillboardUpdateInput) => billboardEndpoints.update(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: billboardKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: billboardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: billboardKeys.myBillboards() });
      toast.success('Billboard updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update billboard';
      toast.error(message);
    },
  });
}

/**
 * Hook to delete a billboard
 */
export function useDeleteBillboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => billboardEndpoints.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billboardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: billboardKeys.myBillboards() });
      toast.success('Billboard deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete billboard';
      toast.error(message);
    },
  });
}

/**
 * Hook to increment view count
 */
export function useIncrementViews() {
  return useMutation({
    mutationFn: (id: string) => billboardEndpoints.incrementViews(id),
  });
}

/**
 * Hook to save/unsave billboards
 */
export function useSaveBillboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, save }: { id: string; save: boolean }) => 
      save ? billboardEndpoints.save(id) : billboardEndpoints.unsave(id),
    onMutate: async ({ id, save }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: billboardKeys.detail(id) });
      
      const previousBillboard = queryClient.getQueryData(billboardKeys.detail(id));
      
      queryClient.setQueryData(billboardKeys.detail(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            isSaved: save,
            totalSaves: save ? (old.data.totalSaves || 0) + 1 : Math.max(0, (old.data.totalSaves || 0) - 1),
          },
        };
      });

      return { previousBillboard };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousBillboard) {
        queryClient.setQueryData(billboardKeys.detail(variables.id), context.previousBillboard);
      }
      toast.error('Failed to update saved status');
    },
    onSuccess: (_, { save }) => {
      toast.success(save ? 'Billboard saved!' : 'Billboard removed from saved');
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: billboardKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: billboardKeys.saved() });
    },
  });
}

/**
 * Hook to get saved billboards
 */
export function useSavedBillboards(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...billboardKeys.saved(), page],
    queryFn: () => billboardEndpoints.getSaved(page, limit),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get owner's billboards
 */
export function useMyBillboards(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...billboardKeys.myBillboards(), page],
    queryFn: () => billboardEndpoints.getMyBillboards(page, limit),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get billboard listing status
 */
export function useBillboardListingStatus(billboardId: string, enabled = true) {
  return useQuery({
    queryKey: [...billboardKeys.detail(billboardId), 'listing-status'],
    queryFn: () => billboardEndpoints.getListingStatus(billboardId),
    enabled: enabled && !!billboardId,
    staleTime: 60 * 1000, // 1 minute
  });
}
