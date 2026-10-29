import { useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'
import { ApplicationStatus } from '../types/jobs.types'
import { dialogService } from '../store/dialogStore'

export function useCloseJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobsApi.closeJob(id),
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['job', id] })
      qc.invalidateQueries({ queryKey: ['myJobs'] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      dialogService.alert('نجاح', 'تم إغلاق الإعلان بنجاح', 'success')
    },
    onError: () => {
      dialogService.alert('خطأ', 'حدث خطأ أثناء إغلاق الإعلان', 'error')
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
      dialogService.alert('نجاح', 'تم حذف الإعلان بنجاح', 'success')
    },
    onError: () => {
      dialogService.alert('خطأ', 'حدث خطأ أثناء حذف الإعلان', 'error')
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
      dialogService.alert('نجاح', 'تم تحديث حالة الطلب بنجاح', 'success')
    },
    onError: () => {
      dialogService.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الطلب', 'error')
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
      dialogService.alert('نجاح', 'تم سحب الطلب بنجاح', 'success')
    },
    onError: () => {
      dialogService.alert('خطأ', 'حدث خطأ أثناء سحب الطلب', 'error')
    }
  })
}
