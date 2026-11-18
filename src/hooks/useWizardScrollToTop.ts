import { useEffect, useRef } from 'react'
import { ScrollView } from 'react-native'

/**
 * Scrolls the wizard ScrollView immediately to the top (y=0, no animation flash)
 * whenever the active step changes.
 */
export function useWizardScrollToTop(step: number) {
  const scrollViewRef = useRef<ScrollView>(null)
  const prevStepRef = useRef<number>(step)

  useEffect(() => {
    if (prevStepRef.current !== step) {
      prevStepRef.current = step
      scrollViewRef.current?.scrollTo({ y: 0, animated: false })
    }
  }, [step])

  return scrollViewRef
}
