import { router } from 'expo-router'

type NotificationData = {
  entityType?: string
  entityId?: string
  roomId?: string
  listingId?: string
  conversationId?: string
  jobId?: string
  applicationId?: string
  requestId?: string
  bookingId?: string
}

/**
 * Single source of truth for "where does tapping this notification go".
 * Used by BOTH the OS push-tap handler (app/_layout.tsx) and the
 * in-app notifications list (app/profile/notifications.tsx) — keep
 * these two callers in sync by always going through this function,
 * never duplicating routing logic in either caller.
 */
export function routeForNotification(data: NotificationData | undefined): string | null {
  if (!data) return null

  // Legacy/explicit fields take priority where present — these are
  // still sent by some notification types alongside entityType
  if (data.roomId) return `/chat/${data.roomId}`
  if (data.conversationId) return `/chat/${data.conversationId}`
  if (data.jobId && !data.applicationId) return `/jobs/${data.jobId}`
  if (data.applicationId) return `/jobs/apply/${data.applicationId}`
  if (data.requestId) return `/transport/${data.requestId}`
  if (data.bookingId) return `/transport/bookings/${data.bookingId}`
  if (data.listingId) return routeForListingEntity(data.entityType, data.listingId)

  // Fall back to the normalized entityType/entityId pair
  if (data.entityType && data.entityId) {
    switch (data.entityType) {
      case 'ROOM':
        return `/chat/${data.entityId}`
      case 'JOB':
        return `/jobs/${data.entityId}`
      case 'JOB_APPLICATION':
        return `/jobs/apply/${data.entityId}`
      case 'TRANSPORT_REQUEST':
        return `/transport/${data.entityId}`
      case 'TRANSPORT_BOOKING':
        return `/transport/bookings/${data.entityId}`
      default:
        return routeForListingEntity(data.entityType, data.entityId)
    }
  }

  return null
}

/**
 * Maps listing-type entityTypes to their detail screen route.
 * Route segments verified against actual app/ folder structure:
 *   app/buses/[id].tsx    → /buses/:id
 *   app/equipment/[id].tsx → /equipment/:id
 *   app/parts/[id].tsx    → /parts/:id
 *   app/services/[id].tsx → /services/:id
 *   app/listings/[id].tsx → /listings/:id  (fallback)
 */
function routeForListingEntity(entityType: string | undefined, id: string): string {
  switch (entityType) {
    case 'BUS_LISTING':
      return `/buses/${id}`
    case 'EQUIPMENT_LISTING':
      return `/equipment/${id}`
    case 'SPARE_PART':
      return `/parts/${id}`
    case 'CAR_SERVICE':
      return `/services/${id}`
    case 'LISTING':
    default:
      return `/listings/${id}`
  }
}

/**
 * Navigates using the router above. If nothing matches, falls back to
 * the notifications list screen instead of doing nothing silently —
 * a notification that goes nowhere should never look "broken" to the
 * user, it should at least land somewhere relevant.
 */
export function navigateFromNotification(data: NotificationData | undefined) {
  const path = routeForNotification(data)
  router.push((path ?? '/profile/notifications') as any)
}
