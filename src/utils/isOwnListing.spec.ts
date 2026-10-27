import { extractListingOwnerId, isOwnListing } from './isOwnListing'

describe('isOwnListing & extractListingOwnerId', () => {
  const CURRENT_USER_ID = 'usr-current-123'

  describe('Cars vertical', () => {
    it('resolves owner from item.user.id', () => {
      const car = { id: 'car-1', user: { id: CURRENT_USER_ID } }
      expect(extractListingOwnerId(car)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(car, CURRENT_USER_ID)).toBe(true)
      expect(isOwnListing(car, 'other-user')).toBe(false)
    })

    it('resolves owner from item.sellerId', () => {
      const car = { id: 'car-2', sellerId: CURRENT_USER_ID }
      expect(extractListingOwnerId(car)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(car, CURRENT_USER_ID)).toBe(true)
    })

    it('resolves owner from item.raw.seller.id', () => {
      const car = { id: 'car-3', raw: { seller: { id: CURRENT_USER_ID } } }
      expect(extractListingOwnerId(car)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(car, CURRENT_USER_ID)).toBe(true)
    })
  })

  describe('Buses vertical', () => {
    it('resolves owner from item.userId', () => {
      const bus = { id: 'bus-1', userId: CURRENT_USER_ID }
      expect(extractListingOwnerId(bus)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(bus, CURRENT_USER_ID)).toBe(true)
    })

    it('resolves owner from item.raw.userId', () => {
      const bus = { id: 'bus-2', raw: { userId: CURRENT_USER_ID } }
      expect(extractListingOwnerId(bus)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(bus, CURRENT_USER_ID)).toBe(true)
    })

    it('resolves owner from item.raw.user.id', () => {
      const bus = { id: 'bus-3', raw: { user: { id: CURRENT_USER_ID } } }
      expect(extractListingOwnerId(bus)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(bus, CURRENT_USER_ID)).toBe(true)
    })
  })

  describe('Equipment vertical', () => {
    it('resolves owner from item.userId', () => {
      const equip = { id: 'eq-1', userId: CURRENT_USER_ID }
      expect(extractListingOwnerId(equip)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(equip, CURRENT_USER_ID)).toBe(true)
    })

    it('resolves owner from item.raw.user.id', () => {
      const equip = { id: 'eq-2', raw: { user: { id: CURRENT_USER_ID } } }
      expect(extractListingOwnerId(equip)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(equip, CURRENT_USER_ID)).toBe(true)
    })
  })

  describe('Spare Parts vertical', () => {
    it('resolves owner from item.sellerId', () => {
      const part = { id: 'part-1', sellerId: CURRENT_USER_ID }
      expect(extractListingOwnerId(part)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(part, CURRENT_USER_ID)).toBe(true)
    })

    it('resolves owner from item.raw.sellerId', () => {
      const part = { id: 'part-2', raw: { sellerId: CURRENT_USER_ID } }
      expect(extractListingOwnerId(part)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(part, CURRENT_USER_ID)).toBe(true)
    })

    it('resolves owner from item.raw.seller.id', () => {
      const part = { id: 'part-3', raw: { seller: { id: CURRENT_USER_ID } } }
      expect(extractListingOwnerId(part)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(part, CURRENT_USER_ID)).toBe(true)
    })
  })

  describe('Car Services vertical', () => {
    it('resolves owner from item.userId', () => {
      const service = { id: 'svc-1', userId: CURRENT_USER_ID }
      expect(extractListingOwnerId(service)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(service, CURRENT_USER_ID)).toBe(true)
    })

    it('resolves owner from item.raw.user.id', () => {
      const service = { id: 'svc-2', raw: { user: { id: CURRENT_USER_ID } } }
      expect(extractListingOwnerId(service)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(service, CURRENT_USER_ID)).toBe(true)
    })
  })

  describe('Unified / My Listings / Fallback fields', () => {
    it('resolves owner from item.ownerId', () => {
      const item = { id: 'item-1', ownerId: CURRENT_USER_ID }
      expect(extractListingOwnerId(item)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(item, CURRENT_USER_ID)).toBe(true)
    })

    it('resolves owner from item.authorId', () => {
      const item = { id: 'item-2', authorId: CURRENT_USER_ID }
      expect(extractListingOwnerId(item)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(item, CURRENT_USER_ID)).toBe(true)
    })

    it('resolves owner from item.raw.ownerId', () => {
      const item = { id: 'item-3', raw: { ownerId: CURRENT_USER_ID } }
      expect(extractListingOwnerId(item)).toBe(CURRENT_USER_ID)
      expect(isOwnListing(item, CURRENT_USER_ID)).toBe(true)
    })
  })

  describe('Edge cases & safety guards', () => {
    it('returns false when currentUserId is null or undefined or empty', () => {
      const item = { id: 'item-1', userId: CURRENT_USER_ID }
      expect(isOwnListing(item, null)).toBe(false)
      expect(isOwnListing(item, undefined)).toBe(false)
      expect(isOwnListing(item, '')).toBe(false)
      expect(isOwnListing(item, '   ')).toBe(false)
    })

    it('returns false when item is null or undefined or not an object', () => {
      expect(isOwnListing(null, CURRENT_USER_ID)).toBe(false)
      expect(isOwnListing(undefined, CURRENT_USER_ID)).toBe(false)
      expect(isOwnListing(123, CURRENT_USER_ID)).toBe(false)
      expect(isOwnListing('string', CURRENT_USER_ID)).toBe(false)
    })

    it('returns false when item has no identifiable owner field', () => {
      expect(isOwnListing({ id: 'orphan-item' }, CURRENT_USER_ID)).toBe(false)
      expect(isOwnListing({ id: 'empty-user', user: null }, CURRENT_USER_ID)).toBe(false)
      expect(isOwnListing({ id: 'empty-seller', seller: {} }, CURRENT_USER_ID)).toBe(false)
    })

    it('trims whitespace when comparing IDs', () => {
      const item = { id: 'item-ws', userId: `  ${CURRENT_USER_ID}  ` }
      expect(isOwnListing(item, CURRENT_USER_ID)).toBe(true)
      expect(isOwnListing(item, ` ${CURRENT_USER_ID} `)).toBe(true)
    })
  })
})
