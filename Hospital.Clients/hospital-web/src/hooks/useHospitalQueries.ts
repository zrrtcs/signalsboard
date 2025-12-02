import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hospitalApi } from '../services/hospitalApi';
import type { VitalSignsInjectionRequest } from '../types/hospital';

/** Query keys for cache management */
export const queryKeys = {
  patients: ['patients'] as const,
  patientsByWard: (wardId: string) => ['patients', wardId] as const,
  patientTrend: (patientId: string, minutes: number) => ['patient-trend', patientId, minutes] as const,
  wards: ['wards'] as const,
};

/**
 * Fetch all patients (optionally filtered by ward)
 */
export function usePatients(wardId?: string) {
  return useQuery({
    queryKey: wardId ? queryKeys.patientsByWard(wardId) : queryKeys.patients,
    queryFn: () => hospitalApi.getPatients(wardId),
    staleTime: 30_000, // Consider fresh for 30s (SignalR handles real-time)
    retry: 2,
  });
}

/**
 * Fetch vital signs trend for a patient
 */
export function usePatientTrend(patientId: string, minutes: number = 240, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.patientTrend(patientId, minutes),
    queryFn: () => hospitalApi.getPatientTrend(patientId, minutes),
    enabled: enabled && !!patientId,
    staleTime: 60_000, // Trend data fresh for 1 minute
    retry: 1,
  });
}

/**
 * Fetch all wards
 */
export function useWards() {
  return useQuery({
    queryKey: queryKeys.wards,
    queryFn: () => hospitalApi.getWards(),
    staleTime: 5 * 60_000, // Wards rarely change, 5 min stale time
  });
}

/**
 * Inject vital signs mutation
 */
export function useInjectVitals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: VitalSignsInjectionRequest) => hospitalApi.injectVitals(request),
    onSuccess: () => {
      // Invalidate patient queries to refetch after injection
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    },
  });
}