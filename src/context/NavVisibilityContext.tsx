/**
 * NavVisibilityContext
 * ─────────────────────────────────────────────────────────
 * Centralized shared animated values for scroll-aware navigation.
 * Drives the tab bar hide/show animation from the UI thread.
 * Zero React re-renders. All animation on the native thread.
 */
import React, { createContext, useContext, useMemo } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'

// ─── Constants ───────────────────────────────────────────
export const TAB_BAR_H = 60   // must match _layout.tsx BAR_H

interface NavVisibilityContextType {
  /** 0 = fully visible (translateY:0), 1 = fully hidden (translateY: TAB_BAR_H+safe) */
  navHidden: SharedValue<number>
}

const NavVisibilityContext = createContext<NavVisibilityContextType | null>(null)

export function NavVisibilityProvider({ children }: { children: React.ReactNode }) {
  const navHidden = useSharedValue(0)

  const value = useMemo(() => ({ navHidden }), [navHidden])

  return (
    <NavVisibilityContext.Provider value={value}>
      {children}
    </NavVisibilityContext.Provider>
  )
}

export function useNavVisibility(): NavVisibilityContextType {
  const ctx = useContext(NavVisibilityContext)
  if (!ctx) throw new Error('useNavVisibility must be inside NavVisibilityProvider')
  return ctx
}
