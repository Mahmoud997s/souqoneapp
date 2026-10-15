import { QueryClient } from '@tanstack/react-query'

/**
 * Invalidates queries associated with user profile changes.
 * Only targets active keys used in the codebase:
 * - ['user']
 * - ['user', userId] (public profile)
 * - ['my-carrier-profile']
 */
export async function invalidateProfileQueries(
  queryClient: QueryClient,
  userId?: string
): Promise<void> {
  const promises: Promise<unknown>[] = [
    queryClient.invalidateQueries({ queryKey: ['user'] }),
    queryClient.invalidateQueries({ queryKey: ['my-carrier-profile'] }),
  ]

  if (userId) {
    promises.push(queryClient.invalidateQueries({ queryKey: ['user', userId] }))
  }

  await Promise.all(promises)
}
