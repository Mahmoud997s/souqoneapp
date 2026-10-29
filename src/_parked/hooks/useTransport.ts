import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportApi } from '../api/transport';
import { mapTransportToCard } from '../utils/mappers';
import { TransportRequest, TransportQuote, TransportBooking, CarrierProfile } from '../types/transport.types';

export function useTransport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['transport-requests', params],
    queryFn: async () => {
      const res = await transportApi.getAll(params);
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data;
      const arr = Array.isArray(raw) ? raw : [];
      return {
        items: arr as TransportRequest[],
        cards: arr.map(mapTransportToCard),
        meta: (res.data as any)?.meta,
      };
    },
  });
}

// Keep the specific name for consistency if used elsewhere
export const useTransportRequests = useTransport;

export function useTransportItem(id: string) {
  return useQuery({
    queryKey: ['transport-item', id],
    queryFn: async () => {
      const res = await transportApi.getById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useMyTransportRequests(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['my-transport-requests', params],
    queryFn: async () => {
      const res = await transportApi.myRequests(params);
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
  });
}

export function useTransportQuotes(requestId: string) {
  return useQuery({
    queryKey: ['transport-quotes', requestId],
    queryFn: async () => {
      const res = await transportApi.getQuotes(requestId);
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: !!requestId,
  });
}

export function useMyTransportQuotes(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['my-transport-quotes', params],
    queryFn: async () => {
      const res = await transportApi.myQuotes(params);
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
  });
}

export function useTransportBooking(id: string) {
  return useQuery({
    queryKey: ['transport-booking', id],
    queryFn: async () => {
      const res = await transportApi.getBooking(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useMyTransportBookings(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['my-transport-bookings', params],
    queryFn: async () => {
      const res = await transportApi.myBookings(params);
      const raw = (res.data as any)?.items ?? (res.data as any)?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
  });
}

export function useCarrierProfile(id?: string) {
  return useQuery({
    queryKey: ['carrier-profile', id || 'me'],
    queryFn: async () => {
      if (id) {
        const res = await transportApi.getCarrier(id);
        return res.data;
      } else {
        const res = await transportApi.getMyCarrierProfile();
        return res.data;
      }
    },
  });
}

export function useTransportStats() {
  return useQuery({
    queryKey: ['transport-stats'],
    queryFn: async () => {
      const res = await transportApi.getStats();
      return res.data;
    },
  });
}

export function useCreateTransportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TransportRequest>) => transportApi.create(data as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-transport-requests'] });
      queryClient.invalidateQueries({ queryKey: ['transport-requests'] });
    },
  });
}
