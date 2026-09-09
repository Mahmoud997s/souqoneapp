import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useMyOperators } from './useEquipment'

export function useOperatorNavigation() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const queryClient = useQueryClient()
  const { refetch } = useMyOperators(false) // Don't fetch on mount automatically unless intended, wait, actually if we fetch on mount it's fine, but let's just use it on demand

  const navigateToAddOperator = async () => {
    if (isNavigating) return
    setIsNavigating(true)

    try {
      // Check if user already has an operator listing using the React Query hook (shared cache)
      const res = await refetch()
      const operators = res.data || []
      
      if (operators.length > 0) {
        // Redirect to edit instead
        router.push(`/equipment/operators/edit/${operators[0].id}`)
      } else {
        // Proceed to add as normal
        router.push('/equipment/operators/add')
      }
    } catch (err) {
      console.error('❌ [useOperatorNavigation] Error checking existing operator:', err)
      // Fallback: Proceed to add and let backend/add.tsx safety net handle it
      router.push('/equipment/operators/add')
    } finally {
      setIsNavigating(false)
    }
  }

  return {
    navigateToAddOperator,
    isNavigating,
  }
}
