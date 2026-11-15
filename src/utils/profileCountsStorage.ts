import AsyncStorage from '@react-native-async-storage/async-storage'
import { logWarn } from './safeLog'

export const PROFILE_COUNTS_KEY_PREFIX = 'souqone_profile_counts:'

export interface PersistedProfileCounts {
  listingsCount?: number
  favoritesCount?: number
}

export function getProfileCountsStorageKey(userId: string): string {
  return `${PROFILE_COUNTS_KEY_PREFIX}${userId}`
}

export async function readProfileCounts(
  userId: string | undefined | null
): Promise<PersistedProfileCounts | null> {
  if (!userId) return null
  try {
    const raw = await AsyncStorage.getItem(getProfileCountsStorageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedProfileCounts | null
    if (!parsed || typeof parsed !== 'object') return null
    return {
      listingsCount: typeof parsed.listingsCount === 'number' ? parsed.listingsCount : undefined,
      favoritesCount: typeof parsed.favoritesCount === 'number' ? parsed.favoritesCount : undefined,
    }
  } catch (error) {
    logWarn('profileCountsStorage:Read', error)
    return null
  }
}

export async function writeProfileCounts(
  userId: string | undefined | null,
  counts: PersistedProfileCounts
): Promise<void> {
  if (!userId) return
  try {
    await AsyncStorage.setItem(getProfileCountsStorageKey(userId), JSON.stringify(counts))
  } catch (error) {
    logWarn('profileCountsStorage:Write', error)
  }
}

export async function clearAllProfileCounts(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const countKeys = keys.filter((key) => key.startsWith(PROFILE_COUNTS_KEY_PREFIX))
    if (countKeys.length > 0) {
      await AsyncStorage.multiRemove(countKeys)
    }
  } catch (error) {
    logWarn('profileCountsStorage:ClearAll', error)
  }
}
