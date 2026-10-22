import { mapOperatorDetail, formatExperienceYears, normalizeCurrency } from './mapOperatorDetail'
import type { OperatorDetailApi } from '../../types/operatorDetailApi.types'

describe('mapOperatorDetail', () => {
  const baseApiData: OperatorDetailApi = {
    id: 'op-100',
    title: 'سائق رافعة محترف معتمد',
    slug: 'certified-crane-operator-100',
    description: '**سائق رافعة** ذو خبرة طويلة في المشاريع الإنشائية.',
    operatorType: 'OPERATOR',
    specializations: ['رافعات برجية', 'رافعات متحركة'],
    experienceYears: 7,
    equipmentTypes: ['CRANE', 'LOADER'],
    certifications: [
      'https://example.com/certs/crane-license.jpg',
      'شهادة السلامة المهنية OSHA',
    ],
    dailyRate: 60,
    hourlyRate: 10,
    currency: 'OMR',
    isPriceNegotiable: true,
    governorate: 'مسقط',
    city: 'السيب',
    governorateRef: { id: 1, nameAr: 'مسقط', nameEn: 'Muscat' },
    wilayaRef: { id: 10, nameAr: 'السيب', nameEn: 'Seeb' },
    latitude: 23.588,
    longitude: 58.3829,
    profileImageUrl: 'https://example.com/avatars/op-100.jpg',
    whatsappEnabled: true,
    status: 'ACTIVE',
    hiddenByOwnerStatus: false,
    viewCount: 240,
    userId: 'user-77',
    user: {
      id: 'user-77',
      username: 'ahmed_crane',
      displayName: 'أحمد البلوشي',
      avatarUrl: 'https://example.com/users/ahmed.jpg',
      isVerified: true,
      governorate: 'مسقط',
      createdAt: '2023-01-15T00:00:00.000Z',
    },
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z',
    pendingDeletionRequest: null,
  }

  describe('Core mapping and rates variations', () => {
    it('maps complete operator listing with both daily and hourly rates', () => {
      const vm = mapOperatorDetail(baseApiData)

      expect(vm.id).toBe('op-100')
      expect(vm.title).toBe('سائق رافعة محترف معتمد')
      expect(vm.description).toBe('سائق رافعة ذو خبرة طويلة في المشاريع الإنشائية.')
      expect(vm.operatorType).toBe('OPERATOR')
      expect(vm.operatorTypeLabel).toBe('مشغل معدات')
      expect(vm.experienceYears).toBe(7)
      expect(vm.experienceYearsLabel).toBe('7 سنوات خبرة')

      // Rates
      expect(vm.rates.dailyRate).toBe(60)
      expect(vm.rates.dailyRateFormatted).toBe('60 ر.ع / يوم')
      expect(vm.rates.hourlyRate).toBe(10)
      expect(vm.rates.hourlyRateFormatted).toBe('10 ر.ع / ساعة')
      expect(vm.rates.isNegotiable).toBe(true)
      expect(vm.rates.primaryLabel).toBe('60 ر.ع / يوم • 10 ر.ع / ساعة')
      expect(vm.rates.hasAnyRate).toBe(true)

      // Equipment chips
      expect(vm.equipmentTypes).toEqual([
        { value: 'CRANE', label: 'رافعة' },
        { value: 'LOADER', label: 'لودر' },
      ])

      // Certifications
      expect(vm.certifications).toHaveLength(2)
      expect(vm.certifications[0]).toEqual({
        key: 'cert-doc-0',
        label: 'شهادة مهنية 1',
        imageUrl: 'https://example.com/certs/crane-license.jpg',
        isDocument: true,
      })
      expect(vm.certifications[1]).toEqual({
        key: 'cert-text-1',
        label: 'شهادة السلامة المهنية OSHA',
        imageUrl: undefined,
        isDocument: false,
      })

      // Seller & Location
      expect(vm.seller.name).toBe('أحمد البلوشي')
      expect(vm.seller.isVerified).toBe(true)
      expect(vm.location.fullLocationText).toBe('مسقط، السيب')
      expect(vm.location.hasCoordinates).toBe(true)

      // Pending deletion absent
      expect(vm.pendingDeletion).toBeNull()
    })

    it('handles daily rate only', () => {
      const vm = mapOperatorDetail({
        ...baseApiData,
        dailyRate: 50,
        hourlyRate: null,
      })

      expect(vm.rates.dailyRate).toBe(50)
      expect(vm.rates.dailyRateFormatted).toBe('50 ر.ع / يوم')
      expect(vm.rates.hourlyRate).toBeUndefined()
      expect(vm.rates.hourlyRateFormatted).toBeUndefined()
      expect(vm.rates.primaryLabel).toBe('50 ر.ع / يوم')
      expect(vm.rates.hasAnyRate).toBe(true)
    })

    it('handles hourly rate only', () => {
      const vm = mapOperatorDetail({
        ...baseApiData,
        dailyRate: null,
        hourlyRate: 8,
      })

      expect(vm.rates.dailyRate).toBeUndefined()
      expect(vm.rates.hourlyRate).toBe(8)
      expect(vm.rates.hourlyRateFormatted).toBe('8 ر.ع / ساعة')
      expect(vm.rates.primaryLabel).toBe('8 ر.ع / ساعة')
      expect(vm.rates.hasAnyRate).toBe(true)
    })

    it('strictly renders "السعر عند التواصل" and never "0 ر.ع" when neither rate is present or 0', () => {
      const vm = mapOperatorDetail({
        ...baseApiData,
        dailyRate: 0,
        hourlyRate: null,
      })

      expect(vm.rates.dailyRate).toBeUndefined()
      expect(vm.rates.hourlyRate).toBeUndefined()
      expect(vm.rates.primaryLabel).toBe('السعر عند التواصل')
      expect(vm.rates.hasAnyRate).toBe(false)
    })

    it('parses Decimal rate given as string', () => {
      const vm = mapOperatorDetail({
        ...baseApiData,
        dailyRate: '75.50',
        hourlyRate: '12.00',
      })

      expect(vm.rates.dailyRate).toBe(75.5)
      expect(vm.rates.hourlyRate).toBe(12)
    })
  })

  describe('Pending deletion request mapping', () => {
    it('maps pending deletion request when present for owner', () => {
      const vm = mapOperatorDetail({
        ...baseApiData,
        pendingDeletionRequest: {
          id: 'del-req-99',
          createdAt: '2026-10-20T10:00:00.000Z',
          status: 'PENDING',
        },
      })

      expect(vm.pendingDeletion).not.toBeNull()
      expect(vm.pendingDeletion?.id).toBe('del-req-99')
      expect(vm.pendingDeletion?.status).toBe('PENDING')
      expect(vm.pendingDeletion?.requestedAtLabel).toBeTruthy()
    })

    it('returns null pendingDeletion when absent', () => {
      const vm = mapOperatorDetail({
        ...baseApiData,
        pendingDeletionRequest: null,
      })

      expect(vm.pendingDeletion).toBeNull()
    })
  })

  describe('Experience years formatting', () => {
    it('formats 0 experience years as "أقل من سنة خبرة"', () => {
      expect(formatExperienceYears(0)).toBe('أقل من سنة خبرة')
      const vm = mapOperatorDetail({ ...baseApiData, experienceYears: 0 })
      expect(vm.experienceYears).toBe(0)
      expect(vm.experienceYearsLabel).toBe('أقل من سنة خبرة')
    })

    it('formats 1 and 2 experience years correctly', () => {
      expect(formatExperienceYears(1)).toBe('سنة خبرة واحدة')
      expect(formatExperienceYears(2)).toBe('سنتان خبرة')
    })

    it('formats 5 and 15 experience years correctly', () => {
      expect(formatExperienceYears(5)).toBe('5 سنوات خبرة')
      expect(formatExperienceYears(15)).toBe('15 سنة خبرة')
    })

    it('handles undefined/null experience years safely', () => {
      expect(formatExperienceYears(null)).toBeUndefined()
      expect(formatExperienceYears(undefined)).toBeUndefined()
      const vm = mapOperatorDetail({ ...baseApiData, experienceYears: null })
      expect(vm.experienceYears).toBeUndefined()
      expect(vm.experienceYearsLabel).toBeUndefined()
    })
  })

  describe('Resilience and edge cases', () => {
    it('handles minimal/empty listing payload safely without throwing', () => {
      const minimalApi = {
        id: 'op-minimal',
        title: '',
        slug: 'op-min',
        operatorType: 'DRIVER' as const,
        equipmentTypes: [],
        status: 'ACTIVE',
        userId: 'user-1',
        user: { id: 'user-1', username: 'driver1', createdAt: '2024-01-01' },
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      } as unknown as OperatorDetailApi

      const vm = mapOperatorDetail(minimalApi)

      expect(vm.id).toBe('op-minimal')
      expect(vm.title).toBe('مشغل معدات')
      expect(vm.operatorTypeLabel).toBe('سائق')
      expect(vm.equipmentTypes).toEqual([])
      expect(vm.certifications).toEqual([])
      expect(vm.rates.primaryLabel).toBe('السعر عند التواصل')
      expect(vm.location.fullLocationText).toBe('سلطنة عُمان')
      expect(vm.location.hasCoordinates).toBe(false)
    })

    it('maps unknown operator type and equipment type gracefully to raw strings', () => {
      const vm = mapOperatorDetail({
        ...baseApiData,
        operatorType: 'UNDERWATER_WELDER' as any,
        equipmentTypes: ['SUBMARINE' as any],
      })

      expect(vm.operatorTypeLabel).toBe('UNDERWATER_WELDER')
      expect(vm.equipmentTypes[0]).toEqual({
        value: 'SUBMARINE',
        label: 'SUBMARINE',
      })
    })

    it('normalizes currency correctly', () => {
      expect(normalizeCurrency('OMR')).toBe('ر.ع')
      expect(normalizeCurrency('omr')).toBe('ر.ع')
      expect(normalizeCurrency('USD')).toBe('$')
      expect(normalizeCurrency(null)).toBe('ر.ع')
      expect(normalizeCurrency('AED')).toBe('AED')
    })
  })
})
