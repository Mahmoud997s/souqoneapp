import { mapJobToCard, mapTransportToCard } from '../utils/mappers';

describe('mappers.location', () => {
  describe('mapJobToCard', () => {
    it('uses governorateRef.nameAr when available', () => {
      const job = {
        id: 1,
        salary: 100,
        salaryPeriod: 'MONTHLY',
        governorateRef: { nameAr: 'مسقط' },
        wilayaRef: { nameAr: 'السيب' }
      };
      const card = mapJobToCard(job);
      expect(card.governorate).toBe('مسقط، السيب');
    });

    it('falls back to "موقع غير محدد" when no ref', () => {
      const job = {
        id: 1,
        salary: 100,
        salaryPeriod: 'MONTHLY',
        // Deliberately missing governorateRef and legacy governorate
      };
      const card = mapJobToCard(job);
      expect(card.governorate).toBe('موقع غير محدد');
    });
  });

  describe('mapTransportToCard', () => {
    it('uses fromGovernorateRef.nameAr when available', () => {
      const transport = {
        id: 1,
        serviceType: 'MOVING',
        fromGovernorateRef: { nameAr: 'الداخلية' },
        toGovernorateRef: { nameAr: 'ظفار' }
      };
      const card = mapTransportToCard(transport);
      expect(card.governorate).toBe('الداخلية');
    });

    it('falls back to fromGovernorate string when no ref', () => {
      const transport = {
        id: 1,
        serviceType: 'MOVING',
        fromGovernorate: 'مسقط'
      };
      const card = mapTransportToCard(transport);
      expect(card.governorate).toBe('مسقط');
    });
  });
});
