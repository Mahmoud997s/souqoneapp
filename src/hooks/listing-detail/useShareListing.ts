import { useCallback } from 'react'
import { Share } from 'react-native'
import { BaseDetailViewModel } from '../../types/carDetailViewModel.types'
import { APP_NAME, SHARE_LINK_ENABLED, buildListingShareUrl } from '../../constants/listing-detail/shareConfig'

export interface ShareListingConfig {
  shareTitle: string
}

export interface UseShareListingReturn {
  share: () => Promise<void>
}

/**
 * Builds the text message to be shared.
 * Appends the listing URL only when includeLink is true.
 */
export function buildShareMessage(
  title: string,
  id: string,
  includeLink: boolean = SHARE_LINK_ENABLED
): string {
  const base = `${title} - ${APP_NAME}`
  if (!includeLink) {
    return base
  }
  return `${base}\n${buildListingShareUrl(id)}`
}

/**
 * useShareListing
 * Hook for sharing a listing via React Native's native Share API.
 * Follows the existing convention in ListingCardBase, equipment, and buses.
 */
export function useShareListing(
  vm: BaseDetailViewModel,
  cfg: ShareListingConfig
): UseShareListingReturn {
  const share = useCallback(async () => {
    try {
      const message = buildShareMessage(cfg.shareTitle, vm.id, SHARE_LINK_ENABLED)
      await Share.share({ message })
    } catch (error) {
      console.log('Error sharing listing:', error)
    }
  }, [vm.id, cfg.shareTitle])

  return { share }
}
