import { useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'
import { ApplicationStatus } from '../types/jobs.types'
import { Alert } from 'react-native'

export function useCloseJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobsApi.closeJob(id),
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['job', id] })
      qc.invalidateQueries({ queryKey: ['myJobs'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      Alert.alert('نجاح', 'تم إغلاق الإعلان بنجاح')
    },
    onError: () => {
      Alert.alert('خطأ', 'حدث خطأ أثناء إغلاق الإعلان')
    }
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobsApi.deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myJobs'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      Alert.alert('نجاح', 'تم حذف الإعلان بنجاح')
    },
    onError: () => {
      Alert.alert('خطأ', 'حدث خطأ أثناء حذف الإعلان')
    }
  })
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) =>
      jobsApi.updateApplicationStatus(applicationId, status),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['jobApplications', res.data.jobId] })
      qc.invalidateQueries({ queryKey: ['myApplications'] })
      Alert.alert('نجاح', 'تم تحديث حالة الطلب بنجاح')
    },
    onError: () => {
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الطلب')
    }
  })
}

export function useWithdrawApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (applicationId: string) => jobsApi.withdrawApplication(applicationId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['jobApplications', res.data.jobId] })
      qc.invalidateQueries({ queryKey: ['myApplications'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      Alert.alert('نجاح', 'تم سحب الطلب بنجاح')
    },
    onError: () => {
      Alert.alert('خطأ', 'حدث خطأ أثناء سحب الطلب')
    }
  })
}
