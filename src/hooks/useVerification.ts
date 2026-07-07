import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'

export function useVerificationStatus() {
  return useQuery({
    queryKey: ['verificationStatus'],
    queryFn: async () => {
      try {
        const res = await jobsApi.getVerificationStatus()
        return res.data
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
    mutationFn: (data: FormData) => jobsApi.submitVerification(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verificationStatus'] })
      qc.invalidateQueries({ queryKey: ['myDriverProfile'] })
    },
  })
}
