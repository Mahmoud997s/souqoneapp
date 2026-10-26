import {
  SUPPORTED_FAVORITE_ENTITY_TYPES,
  favoriteKey,
  favoriteTypeForCard,
} from './favoriteEntityTypes'

describe('favoriteEntityTypes', () => {
  it('builds canonical favorite key "<TYPE>:<id>"', () => {
    expect(favoriteKey('BUS_LISTING', 'b-123')).toBe('BUS_LISTING:b-123')
    expect(favoriteKey('EQUIPMENT_LISTING', 'eq-456')).toBe('EQUIPMENT_LISTING:eq-456')
    expect(favoriteKey('LISTING', 'car-789')).toBe('LISTING:car-789')
  })

  it('resolves explicit prop and beats item category', () => {
    const item = { id: 'item-1', category: 'cars' }
    expect(favoriteTypeForCard(item, 'BUS_LISTING')).toBe('BUS_LISTING')
    expect(favoriteTypeForCard(item, 'EQUIPMENT_LISTING')).toBe('EQUIPMENT_LISTING')
  })

  it('maps supported categories correctly from item', () => {
    expect(favoriteTypeForCard({ id: '1', category: 'buses' })).toBe('BUS_LISTING')
    expect(favoriteTypeForCard({ id: '2', category: 'equipment' })).toBe('EQUIPMENT_LISTING')
    expect(favoriteTypeForCard({ id: '3', category: 'cars' })).toBe('LISTING')
    expect(favoriteTypeForCard({ id: '4', category: 'parts' })).toBe('SPARE_PART')
    expect(favoriteTypeForCard({ id: '5', category: 'services' })).toBe('CAR_SERVICE')
    expect(favoriteTypeForCard({ id: '6', category: 'jobs' })).toBe('DRIVER_JOB')
  })

  it('returns null for OPERATOR_LISTING (operators have NO favorites per decision)', () => {
    expect(favoriteTypeForCard({ id: 'op-1', category: 'operators' })).toBeNull()
    expect(favoriteTypeForCard({ id: 'op-1', category: 'operator' })).toBeNull()
    expect(favoriteTypeForCard(null, 'OPERATOR_LISTING')).toBeNull()
  })

  it('returns null for unsupported profiles (driver, employer, carrier)', () => {
    expect(favoriteTypeForCard({ id: 'd-1', category: 'drivers' })).toBeNull()
    expect(favoriteTypeForCard({ id: 'e-1', category: 'employers' })).toBeNull()
    expect(favoriteTypeForCard({ id: 'c-1', category: 'carriers' })).toBeNull()
    expect(favoriteTypeForCard(null, 'DRIVER_PROFILE')).toBeNull()
    expect(favoriteTypeForCard(null, 'EMPLOYER_PROFILE')).toBeNull()
    expect(favoriteTypeForCard(null, 'CARRIER_PROFILE')).toBeNull()
  })

  it('returns null for null/undefined item with no explicit type', () => {
    expect(favoriteTypeForCard(null)).toBeNull()
    expect(favoriteTypeForCard(undefined)).toBeNull()
  })
})
