# Favorites Feature Module

Single source of truth and one unified pipeline for all favorite interactions (cards, detail screens, favorites page, home tab).

## Architecture & Data Flow
1. **IDs Cache (`useFavoriteIds`)**:
   - Fetches `GET /favorites/ids` on login.
   - Parses into an in-memory `Set<string>` formatted as `<ENTITY_TYPE>:<entityId>`.
   - All heart components read synchronously from this Set via `useFavoriteToggle`.
2. **Unified Mutation (`useFavoriteToggle`)**:
   - Single pipeline per toggle action: optimistic cache update of `['favorite-ids']` and check key.
   - In-flight request guard per entity key prevents duplicate requests or stale latches.
   - Server confirmation shows professional floating `GlobalToast` (5 seconds).
   - Network failure performs instant rollback and shows Arabic error alert via `dialogService`.
   - On settle, invalidates `['favorite-ids']`, `['favorites']`, and detail query keys.
3. **Entity Resolution (`favoriteEntityTypes.ts`)**:
   - Single authority mapping cards/categories to backend supported entity types.
   - Operators have NO favorites (`favoriteTypeForCard` returns `null`).

## Strict Architectural Guard
- **NEVER** import or call `favoritesApi` outside `src/features/favorites/` or `src/api/favorites.ts`.
- **NEVER** build ad-hoc entity type maps in screens or components.
- Enforced by `src/__tests__/architecture/favoritesSingleSource.spec.ts`.

## Adding a New Vertical
1. Add the backend model enum to `SUPPORTED_FAVORITE_ENTITY_TYPES` in `favoriteEntityTypes.ts`.
2. Map its category in `favoriteTypeForCard`.
3. Pass `favoriteType` to the card or let `favoriteTypeForCard` resolve it automatically.
