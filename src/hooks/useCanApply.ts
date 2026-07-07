import { useAuthStore } from '../store/authStore'
import { useMyDriverProfile } from './useDriverProfile'
import { useMyEmployerProfile } from './useEmployerProfile'
import { DriverJob } from '../types/jobs.types'
import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'

export function useCanApply(job?: DriverJob) {
  const { isLoggedIn, user } = useAuthStore()
  const { data: driverProfile } = useMyDriverProfile()
  const { data: employerProfile } = useMyEmployerProfile()

  // Check if user has already applied
  const { data: applications } = useQuery({
    queryKey: ['jobApplications', job?.id],
    queryFn: async () => {
      if (!job?.id) return []
      try {
        const res = await jobsApi.getApplicants(job.id)
        return res.data
      } catch {
        return []
      }
    },
    enabled: isLoggedIn && !!job?.id,
  })

  if (!job) {
    return {
      canApply: false,
      reason: 'INVALID_JOB',
    }
  }

  if (!isLoggedIn || !user) {
    return {
      canApply: false,
      reason: 'LOGIN_REQUIRED',
    }
  }

  const isJobOwner = job.userId === user.id
  if (isJobOwner) {
    return {
      canApply: false,
      reason: 'OWNER',
    }
  }

  if (job.status !== 'ACTIVE') {
    return {
      canApply: false,
      reason: 'NOT_ACTIVE',
    }
  }

  const alreadyApplied = Array.isArray(applications) && applications.some(app => app.applicantId === user.id)
  if (alreadyApplied) {
    return {
      canApply: false,
      reason: 'ALREADY_APPLIED',
    }
  }

  const hasDriverProfile = !!driverProfile
  const hasEmployerProfile = !!employerProfile

  if (job.jobType === 'HIRING') {
    if (!hasDriverProfile) {
      return {
        canApply: false,
        reason: 'DRIVER_PROFILE_REQUIRED',
      }
    }
    return {
      canApply: true,
      reason: null,
    }
  }

  if (job.jobType === 'OFFERING') {
    if (!hasEmployerProfile) {
      return {
        canApply: false,
        reason: 'EMPLOYER_PROFILE_REQUIRED',
      }
    }
    return {
      canApply: true,
      reason: null,
    }
  }

  return {
    canApply: false,
    reason: 'UNKNOWN',
  }
}
