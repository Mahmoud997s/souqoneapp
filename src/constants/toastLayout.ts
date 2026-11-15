import { Platform } from 'react-native'
import { BottomBarTokens, CHAT_INPUT_BAR_HEIGHT } from './bottomBarTokens'
import { Spacing } from './spacing'
import { CONTACT_ACTIONS_BAR_HEIGHT } from '../components/listing-detail/ContactActions'
import { OWNER_MANAGE_BAR_HEIGHT } from '../components/listing-detail/OwnerManageBar'
import { WIZARD_STICKY_FOOTER_CONTENT_HEIGHT } from '../components/ui/WizardStickyFooter'

export type ToastBottomBarKind =
  | 'tab'
  | 'section'
  | 'detail'
  | 'wizard'
  | 'chat'
  | 'plain'

export interface RouteBottomBarEntry {
  /** Normalized route template without `(group)` segments (e.g. `/cars/[id]`). */
  pattern: string
  kind: ToastBottomBarKind
}

/**
 * Exhaustive route-to-bottom-bar classification table covering every route in `app/`.
 * Enforced by `src/__tests__/toastRouteGuard.spec.ts` so new routes cannot silently
 * fall back without an explicit classification.
 */
export const ROUTE_BOTTOM_BAR_ENTRIES: readonly RouteBottomBarEntry[] = [
  // Root & tab bar screens (GlassBottomBarShell in app/(tabs)/_layout.tsx)
  { pattern: '/', kind: 'tab' },
  { pattern: '/search', kind: 'tab' },
  { pattern: '/post', kind: 'tab' },
  { pattern: '/chat', kind: 'tab' },
  { pattern: '/profile', kind: 'tab' },

  // Section browse & hub screens (UnifiedBottomBar -> GlassBottomBarShell)
  { pattern: '/cars', kind: 'section' },
  { pattern: '/cars/browse', kind: 'section' },
  { pattern: '/buses', kind: 'section' },
  { pattern: '/buses/browse', kind: 'section' },
  { pattern: '/equipment', kind: 'section' },
  { pattern: '/equipment/browse', kind: 'section' },
  { pattern: '/equipment/operators/browse', kind: 'section' },
  { pattern: '/parts', kind: 'section' },
  { pattern: '/parts/browse', kind: 'section' },
  { pattern: '/services', kind: 'section' },
  { pattern: '/services/browse', kind: 'section' },

  // 6 Listing detail screens (ContactActions 64.4 vs OwnerManageBar 60.4 -> max)
  { pattern: '/cars/[id]', kind: 'detail' },
  { pattern: '/buses/[id]', kind: 'detail' },
  { pattern: '/equipment/[id]', kind: 'detail' },
  { pattern: '/equipment/operators/[id]', kind: 'detail' },
  { pattern: '/parts/[id]', kind: 'detail' },
  { pattern: '/services/[id]', kind: 'detail' },
  { pattern: '/listings/[id]', kind: 'detail' },

  // Wizard screens (WizardStickyFooter)
  { pattern: '/cars/new', kind: 'wizard' },
  { pattern: '/buses/new', kind: 'wizard' },
  { pattern: '/buses/edit/[id]', kind: 'wizard' },
  { pattern: '/equipment/new', kind: 'wizard' },
  { pattern: '/equipment/edit/[id]', kind: 'wizard' },
  { pattern: '/equipment/operators/add', kind: 'wizard' },
  { pattern: '/equipment/operators/edit/[id]', kind: 'wizard' },
  { pattern: '/parts/new', kind: 'wizard' },
  { pattern: '/services/new', kind: 'wizard' },

  // Chat room (ChatInput bar)
  { pattern: '/chat/[id]', kind: 'chat' },

  // Plain screens without persistent bottom bar
  { pattern: '/account-blocked', kind: 'plain' },
  { pattern: '/forgot-password', kind: 'plain' },
  { pattern: '/login', kind: 'plain' },
  { pattern: '/onboarding', kind: 'plain' },
  { pattern: '/register', kind: 'plain' },
  { pattern: '/reset-password', kind: 'plain' },
  { pattern: '/verify-email', kind: 'plain' },
  { pattern: '/filters', kind: 'plain' },
  { pattern: '/image-viewer', kind: 'plain' },
  { pattern: '/post-category', kind: 'plain' },
  { pattern: '/cars/drafts', kind: 'plain' },
  { pattern: '/buses/drafts', kind: 'plain' },
  { pattern: '/equipment/drafts', kind: 'plain' },
  { pattern: '/parts/drafts', kind: 'plain' },
  { pattern: '/services/drafts', kind: 'plain' },
  { pattern: '/post/edit/[id]', kind: 'plain' },
  { pattern: '/post/step2', kind: 'plain' },
  { pattern: '/post/step3', kind: 'plain' },
  { pattern: '/post/step4', kind: 'plain' },
  { pattern: '/post/step5', kind: 'plain' },
  { pattern: '/profile/[userId]', kind: 'plain' },
  { pattern: '/profile/change-password', kind: 'plain' },
  { pattern: '/profile/delete-account', kind: 'plain' },
  { pattern: '/profile/edit-profile', kind: 'plain' },
  { pattern: '/profile/favorites', kind: 'plain' },
  { pattern: '/profile/my-listings', kind: 'plain' },
  { pattern: '/profile/notifications', kind: 'plain' },
  { pattern: '/profile/settings', kind: 'plain' },
  { pattern: '/profile/subscription', kind: 'plain' },
  { pattern: '/reviews/[entityId]', kind: 'plain' },
]

const TAB_BAR_MIN_BOTTOM_PAD = 16
const BAR_MIN_BOTTOM_PAD = 12
const DETAIL_STICKY_BAR_HEIGHT = Math.ceil(
  Math.max(CONTACT_ACTIONS_BAR_HEIGHT, OWNER_MANAGE_BAR_HEIGHT)
)

function normalizePathname(pathname?: string | null): string {
  if (!pathname) return '/'
  const trimmed = pathname.split('?')[0].replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

function matchRoutePattern(pattern: string, pathname: string): boolean {
  if (pattern === pathname) return true
  const patternParts = pattern.split('/')
  const pathParts = pathname.split('/')
  if (patternParts.length !== pathParts.length) return false
  return patternParts.every(
    (part, index) => part.startsWith('[') && part.endsWith(']') ? pathParts[index].length > 0 : part === pathParts[index]
  )
}

export function classifyToastRoute(pathname?: string | null): ToastBottomBarKind {
  if (!pathname || pathname.trim() === '') return 'plain'
  const normalized = normalizePathname(pathname)
  // Exact static matches take precedence over dynamic `[id]` patterns (e.g. `/cars/browse` vs `/cars/[id]`).
  const exact = ROUTE_BOTTOM_BAR_ENTRIES.find((entry) => entry.pattern === normalized)
  if (exact) return exact.kind
  const dynamic = ROUTE_BOTTOM_BAR_ENTRIES.find((entry) =>
    matchRoutePattern(entry.pattern, normalized)
  )
  return dynamic ? dynamic.kind : 'plain'
}

export interface ComputeToastBottomOffsetParams {
  pathname?: string | null
  bottomInset: number
  keyboardHeight?: number
  platformOS?: 'ios' | 'android' | string
}

/**
 * Computes the `bottom` offset for `GlobalToast` so it clears any bottom navigation,
 * detail action bar, wizard footer, chat input, or open software keyboard.
 *
 * Android (`app.json` omits `softwareKeyboardLayoutMode`, defaulting to `adjustResize`
 * as confirmed in `app/chat/[id].tsx:304`) resizes the root viewport above the keyboard,
 * whereas iOS overlays the keyboard over the root `<Stack>` so `keyboardHeight` is added on iOS.
 */
export function computeGlobalToastBottomOffset({
  pathname,
  bottomInset,
  keyboardHeight = 0,
  platformOS = Platform.OS,
}: ComputeToastBottomOffsetParams): number {
  const safeBottom = Math.max(0, bottomInset)
  const kind = classifyToastRoute(pathname)

  if (keyboardHeight > 0) {
    const chatClearance = kind === 'chat' ? CHAT_INPUT_BAR_HEIGHT : 0
    if (platformOS === 'ios') {
      return keyboardHeight + chatClearance + Spacing.space3
    }
    return chatClearance + (kind === 'chat' ? Spacing.space3 : Spacing.space4)
  }

  switch (kind) {
    case 'tab': {
      const tabPad = safeBottom > 0 ? safeBottom : TAB_BAR_MIN_BOTTOM_PAD
      return tabPad + BottomBarTokens.collapsedSize + Spacing.space3
    }
    case 'section': {
      const sectionPad = Math.max(safeBottom, BAR_MIN_BOTTOM_PAD)
      return sectionPad + BottomBarTokens.collapsedSize + Spacing.space3
    }
    case 'detail': {
      const detailPad = Math.max(safeBottom, BAR_MIN_BOTTOM_PAD)
      return detailPad + DETAIL_STICKY_BAR_HEIGHT + Spacing.space3
    }
    case 'wizard': {
      const wizardPad = Math.max(safeBottom, BAR_MIN_BOTTOM_PAD)
      return wizardPad + WIZARD_STICKY_FOOTER_CONTENT_HEIGHT + Spacing.space3
    }
    case 'chat': {
      const chatPad = safeBottom || Spacing.space3
      return chatPad + CHAT_INPUT_BAR_HEIGHT + Spacing.space3
    }
    case 'plain':
    default: {
      return Math.max(safeBottom, BAR_MIN_BOTTOM_PAD) + Spacing.space4
    }
  }
}
