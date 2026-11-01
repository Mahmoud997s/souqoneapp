export type PublicProfileListingVertical = 'car' | 'bus' | 'equipment' | 'part' | 'service'

export const publicProfileKeys = {
  all: ['public-profile-listings'] as const,
  list: (userId: string, vertical: PublicProfileListingVertical, filters: Record<string, unknown>) =>
    ['public-profile-listings', userId, vertical, filters] as const,
}
