import { useState } from 'react'
import { queryClient } from '../api/queryClient'
import { useAuthStore } from '../store/authStore'
import { toastService } from '../store/toastStore'
import { usersApi } from '../api/users'
import { showErrorDialog } from '../utils/showErrorDialog'

export function useAccountDeletion() {
  const [cancelling, setCancelling] = useState(false)
  const updateUser = useAuthStore((s) => s.updateUser)
  const user = useAuthStore((s) => s.user)

  const handleCancelDeletion = () => {
    toastService.confirm({
      title: 'إلغاء طلب حذف الحساب',
      message: 'هل تريد بالتأكيد إلغاء طلب حذف حسابك واستعادة إعلاناتك؟',
      intent: 'primary',
      confirmLabel: 'نعم، إلغاء الحذف',
      cancelLabel: 'تراجع',
      onConfirm: async () => {
        try {
          setCancelling(true)
          await usersApi.cancelDeletion()
          updateUser({ deletionScheduledAt: null })
          queryClient.invalidateQueries()
          toastService.show({
            kind: 'success',
            title: 'تم إلغاء طلب حذف الحساب',
          })
        } catch (err: any) {
          const status = err?.response?.status
          const message = err?.response?.data?.message || err?.message
          // If already not scheduled or bad request, synchronize local state
          if (
            status === 400 ||
            (typeof message === 'string' && message.includes('غير مجدول'))
          ) {
            updateUser({ deletionScheduledAt: null })
            queryClient.invalidateQueries()
            toastService.show({
              kind: 'info',
              title: 'الحساب غير مجدول للحذف حالياً',
            })
          } else {
            showErrorDialog(err, 'تعذر إلغاء طلب حذف الحساب. يرجى المحاولة مرة أخرى.')
          }
        } finally {
          setCancelling(false)
        }
      },
    })
  }

  return {
    user,
    isScheduled: Boolean(user?.deletionScheduledAt),
    deletionScheduledAt: user?.deletionScheduledAt,
    cancelling,
    handleCancelDeletion,
  }
}
