import { formatLocation, mapListingToCard } from '../utils/mappers';

describe('mappers.location', () => {
  describe('formatLocation via mapListingToCard', () => {
    it('uses governorateRef.nameAr when available', () => {
      const item = {
        id: 1,
        price: 100,
        governorateRef: { nameAr: 'مسقط' },
        wilayaRef: { nameAr: 'السيب' },
      };
      const card = mapListingToCard(item);
      expect(card.governorate).toBe('مسقط، السيب');
    });

    it('falls back to legacy governorate string when no ref', () => {
      const item = {
        id: 1,
        price: 100,
        governorate: 'ظفار',
      };
      const card = mapListingToCard(item);
      expect(card.governorate).toBe('ظفار');
    });

    it('returns empty string when no location provided', () => {
      const item = {
        id: 1,
        price: 100,
      };
      const card = mapListingToCard(item);
      expect(card.governorate).toBe('');
    });
  });
});
