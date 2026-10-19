import { useState } from 'react'
import { queryClient } from '../api/queryClient'
import { useAuthStore } from '../store/authStore'
import { dialogService } from '../store/dialogStore'
import { usersApi } from '../api/users'

export function useAccountDeletion() {
  const [cancelling, setCancelling] = useState(false)
  const updateUser = useAuthStore((s) => s.updateUser)
  const user = useAuthStore((s) => s.user)

  const handleCancelDeletion = () => {
    dialogService.confirm(
      'إلغاء طلب حذف الحساب',
      'هل تريد بالتأكيد إلغاء طلب حذف حسابك واستعادة إعلاناتك؟',
      async () => {
        try {
          setCancelling(true)
          await usersApi.cancelDeletion()
          updateUser({ deletionScheduledAt: null })
          queryClient.invalidateQueries()
          dialogService.alert(
            'تم الإلغاء',
            'تم إلغاء طلب حذف حسابك وسيتم إظهار إعلاناتك مرة أخرى.',
            'success',
          )
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
            dialogService.alert(
              'تنبيه',
              'الحساب غير مجدول للحذف حالياً.',
              'info',
            )
          } else {
            const errorMsg =
              typeof message === 'string'
                ? message
                : Array.isArray(message)
                  ? message[0]
                  : 'تعذر إلغاء طلب حذف الحساب. يرجى المحاولة مرة أخرى.'
            dialogService.alert('خطأ', errorMsg)
          }
        } finally {
          setCancelling(false)
        }
      },
      'نعم، إلغاء الحذف',
      'تراجع',
    )
  }

  return {
    user,
    isScheduled: Boolean(user?.deletionScheduledAt),
    deletionScheduledAt: user?.deletionScheduledAt,
    cancelling,
    handleCancelDeletion,
  }
}
