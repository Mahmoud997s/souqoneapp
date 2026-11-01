import { useCallback, useMemo, useRef, useState } from 'react'
import {
  PanResponder,
  GestureResponderHandlers,
  LayoutChangeEvent,
} from 'react-native'
import * as Haptics from 'expo-haptics'

export interface TabDragSelectTabItem {
  id: string
  isPost?: boolean
}

export interface UseTabDragSelectOptions<T extends TabDragSelectTabItem> {
  tabs: T[]
  onTabPress: (tab: T) => void
  onPostPress: () => void
}

export interface UseTabDragSelectReturn {
  panHandlers: GestureResponderHandlers
  draggingTabId: string | null
  onBarLayout: (event: LayoutChangeEvent) => void
}

/**
 * useTabDragSelect
 * Extracted drag-selection gesture hook for bottom bars with multiple tabs.
 * Manages bar layout width, horizontal coordinate mapping, hover tracking,
 * haptics micro-feedback, and commit on release.
 */
export function useTabDragSelect<T extends TabDragSelectTabItem>({
  tabs,
  onTabPress,
  onPostPress,
}: UseTabDragSelectOptions<T>): UseTabDragSelectReturn {
  const [barWidth, setBarWidth] = useState(0)
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null)

  const tabsRef = useRef(tabs)
  tabsRef.current = tabs

  const barWidthRef = useRef(barWidth)
  barWidthRef.current = barWidth

  const onTabPressRef = useRef(onTabPress)
  onTabPressRef.current = onTabPress

  const onPostPressRef = useRef(onPostPress)
  onPostPressRef.current = onPostPress

  const currentHoverIdRef = useRef<string | null>(null)

  const getTabIndexFromX = useCallback((x: number) => {
    const w = barWidthRef.current
    const currentTabs = tabsRef.current
    if (w <= 0 || currentTabs.length === 0) return 0
    const tabWidth = w / currentTabs.length
    const index = Math.floor(x / tabWidth)
    return Math.min(Math.max(0, index), currentTabs.length - 1)
  }, [])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 6,

        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX
          const index = getTabIndexFromX(x)
          const currentTabs = tabsRef.current
          const targetTab = currentTabs[index]
          if (targetTab) {
            currentHoverIdRef.current = targetTab.id
            setDraggingTabId(targetTab.id)
            try {
              Haptics.selectionAsync()
            } catch {}
          }
        },

        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX
          const index = getTabIndexFromX(x)
          const currentTabs = tabsRef.current
          const targetTab = currentTabs[index]
          if (targetTab && targetTab.id !== currentHoverIdRef.current) {
            currentHoverIdRef.current = targetTab.id
            setDraggingTabId(targetTab.id)
            try {
              Haptics.selectionAsync()
            } catch {}
          }
        },

        onPanResponderRelease: (evt) => {
          const x = evt.nativeEvent.locationX
          const index = getTabIndexFromX(x)
          const currentTabs = tabsRef.current
          const targetTab = currentTabs[index]

          setDraggingTabId(null)
          currentHoverIdRef.current = null

          if (targetTab) {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            } catch {}

            if (targetTab.isPost) {
              onPostPressRef.current()
            } else {
              onTabPressRef.current(targetTab)
            }
          }
        },

        onPanResponderTerminate: () => {
          setDraggingTabId(null)
          currentHoverIdRef.current = null
        },
      }),
    [getTabIndexFromX]
  )

  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width
    barWidthRef.current = width
    setBarWidth(width)
  }, [])

  return {
    panHandlers: panResponder.panHandlers,
    draggingTabId,
    onBarLayout,
  }
}
