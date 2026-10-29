import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'

export function useVerificationStatus() {
  return useQuery({
    queryKey: ['verificationStatus'],
    queryFn: async () => {
      try {
        const res = await jobsApi.getVerificationStatus()
        // Handle case where backend wraps in { success: true, data: { ... } }
        let data = (res.data as any)?.data ? (res.data as any).data : res.data
        // Handle case where backend returns an array from findMany
        if (Array.isArray(data)) {
          data = data.length > 0 ? data[0] : null
        }
        return data
      } catch (e) {
        // Return null if no verification request exists yet
        return null
      }
    },
  })
}

export function useSubmitVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { licenseImageUrl: string; licenseBackImageUrl?: string; idImageUrl: string; idBackImageUrl?: string; notes?: string }) => jobsApi.submitVerification(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verificationStatus'] })
      qc.invalidateQueries({ queryKey: ['myDriverProfile'] })
    },
  })
}
