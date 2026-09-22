/**
 * Listing Detail Sharing Configuration
 *
 * APP_NAME: Canonical Arabic spelling confirmed dominant across 18+ codebase files.
 * SHARE_LINK_ENABLED: Gated to false by default (Decision A-25) pending confirmation
 * that souqone.app/listings/<id> routes correctly in the live mobile / web environment.
 */
export const APP_NAME = 'سوق ون'

export const SHARE_LINK_ENABLED = false

export function buildListingShareUrl(id: string): string {
  return `https://souqone.app/listings/${id}`
}
