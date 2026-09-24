import { CarFormData } from '../../types/carForm.types'
import { CarDetailApi } from '../../types/carDetailApi.types'
import {
  carFieldRegistry,
  EXCLUDED_FROM_DETAIL,
  FieldDef,
} from './carFieldRegistry'

/**
 * Compile-time and runtime list of all 49 properties defined in CarFormData.
 * If any property is added or removed from CarFormData, this type assertion
 * and the unit test will immediately flag the disparity.
 */
const ALL_CAR_FORM_KEYS: (keyof CarFormData)[] = [
  'title',
  'description',
  'listingType',
  'condition',
  'year',
  'price',
  'mileage',
  'fuelType',
  'transmission',
  'bodyType',
  'exteriorColor',
  'interior',
  'engineSize',
  'horsepower',
  'doors',
  'seats',
  'driveType',
  'features',
  'currency',
  'isPriceNegotiable',
  'dailyPrice',
  'monthlyPrice',
  'withDriver',
  'depositAmount',
  'minRentalDays',
  'kmLimitPerDay',
  'cancellationPolicy',
  'deliveryAvailable',
  'insuranceIncluded',
  'governorateId',
  'wilayaId',
  'latitude',
  'longitude',
  'brandId',
  'carModelId',
  'carTrimId',
  'make',
  'model',
  'trim',
  'governorateName',
  'wilayaName',
  'images',
  'existingImages',
  'removedImageIds',
  'editMode',
  'editListingId',
  'version',
  'originalBrandId',
  'originalCarModelId',
]

describe('carFieldRegistry & EXCLUDED_FROM_DETAIL Parity', () => {
  const registeredIds = carFieldRegistry.map((f) => f.id)
  const excludedIds = Object.keys(EXCLUDED_FROM_DETAIL)
  const allCoveredIds = [...registeredIds, ...excludedIds]

  it('ensures every CarFormData field is either registered or explicitly excluded (zero missing fields)', () => {
    const missingKeys: string[] = []
    ALL_CAR_FORM_KEYS.forEach((key) => {
      if (!allCoveredIds.includes(key)) {
        missingKeys.push(key)
      }
    })

    expect(missingKeys).toEqual([])
  })

  it('ensures every registered or excluded ID actually exists on CarFormData (zero dead/stale fields)', () => {
    const staleKeys: string[] = []
    allCoveredIds.forEach((id) => {
      if (!ALL_CAR_FORM_KEYS.includes(id as keyof CarFormData)) {
        staleKeys.push(id)
      }
    })

    expect(staleKeys).toEqual([])
  })

  it('ensures zero overlap between registered fields and excluded fields', () => {
    const overlaps = registeredIds.filter((id) => excludedIds.includes(id))
    expect(overlaps).toEqual([])
  })

  it('confirms exactly 49 total properties are accounted for', () => {
    expect(ALL_CAR_FORM_KEYS.length).toBe(49)
    expect(registeredIds.length).toBe(24)
    expect(excludedIds.length).toBe(25)
    expect(registeredIds.length + excludedIds.length).toBe(49)
  })

  it('ensures rental fields have visibleWhen returning false for SALE and true for RENTAL', () => {
    const rentalField = carFieldRegistry.find((f) => f.id === 'depositAmount')
    expect(rentalField).toBeDefined()
    expect(rentalField?.visibleWhen).toBeDefined()

    const saleRaw = { listingType: 'SALE' } as CarDetailApi
    const rentalRaw = { listingType: 'RENTAL' } as CarDetailApi

    expect(rentalField?.visibleWhen!(saleRaw)).toBe(false)
    expect(rentalField?.visibleWhen!(rentalRaw)).toBe(true)
  })

  it('resolves color swatch hex code for exteriorColor and returns undefined when absent', () => {
    const colorField = carFieldRegistry.find((f) => f.id === 'exteriorColor')
    expect(colorField).toBeDefined()
    expect(colorField?.swatch).toBeDefined()

    const rawWithColor = { exteriorColor: 'solid_white' } as CarDetailApi
    expect(colorField?.swatch!(rawWithColor)).toBe('#FFFFFF')

    const rawWithoutColor = { exteriorColor: undefined } as unknown as CarDetailApi
    expect(colorField?.swatch!(rawWithoutColor)).toBeUndefined()
  })

  it('translates every real exteriorColor value found in the live data', () => {
    const field = carFieldRegistry.find((f) => f.id === 'exteriorColor')!
    const fmt = (v: string) => field.format({ exteriorColor: v } as CarDetailApi)
    expect(fmt('metallic_white')).toBe('أبيض ميتاليك')
    expect(fmt('White')).toBe('أبيض')
    expect(fmt('white')).toBe('أبيض')
    expect(fmt('silver')).toBe('فضي')
    expect(fmt('forest_green')).toBe('أخضر غابي')
    expect(fmt('blue')).toBe('أزرق')
    expect(fmt('carmineRed')).toBe('أحمر كارمين')
    expect(fmt('darkGray')).toBe('رمادي داكن')
    // Arabic free text stored by other listings passes through untouched
    expect(fmt('كحلي')).toBe('كحلي')
    expect(fmt('أخضر بريطاني')).toBe('أخضر بريطاني')
    // never-seen values keep the raw fallback
    expect(fmt('space_grey_2099')).toBe('space_grey_2099')
    expect(field.swatch!({ exteriorColor: 'carmineRed' } as CarDetailApi)).toBe('#960018')
    expect(field.swatch!({ exteriorColor: 'White' } as CarDetailApi)).toBe('#FFFFFF')
    expect(field.swatch!({ exteriorColor: 'space_grey_2099' } as CarDetailApi)).toBeUndefined()
  })

  it('translates every real interior value found in the live data, including color+material compounds', () => {
    const field = carFieldRegistry.find((f) => f.id === 'interior')!
    const fmt = (v: string) => field.format({ interior: v } as CarDetailApi)
    expect(fmt('ivory')).toBe('عاجي')
    expect(fmt('Black')).toBe('أسود')
    expect(fmt('solid_black')).toBe('أسود')
    expect(fmt('beigeLeather')).toBe('جلد بيج')
    expect(fmt('blackLeather')).toBe('جلد أسود')
    expect(fmt('grayFabric')).toBe('قماش رمادي')
    // Arabic free text stored by other listings passes through untouched
    expect(fmt('جلد بيج')).toBe('جلد بيج')
    expect(fmt('جلد نابا أسود')).toBe('جلد نابا أسود')
    // unknown color part or unknown material keeps the raw fallback
    expect(fmt('unknownLeather')).toBe('unknownLeather')
    expect(fmt('beigeSuede')).toBe('beigeSuede')
  })

  it('formats depositAmount from numbers and Decimal strings with thousands separators', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const depositField = carFieldRegistry.find((f) => f.id === 'depositAmount')!
    expect(depositField.format({ depositAmount: 100 } as CarDetailApi)).toBe('100 ر.ع')
    expect(depositField.format({ depositAmount: '100' } as unknown as CarDetailApi)).toBe('100 ر.ع')
    expect(depositField.format({ depositAmount: '1500' } as unknown as CarDetailApi)).toBe('1,500 ر.ع')
    expect(depositField.format({ depositAmount: null } as unknown as CarDetailApi)).toBeNull()
    expect(depositField.format({ depositAmount: '' } as unknown as CarDetailApi)).toBeNull()
    expect(depositField.format({ depositAmount: 'abc' } as unknown as CarDetailApi)).toBeNull()
    warn.mockRestore()
  })

  it('translates interior color through CAR_COLORS and passes unknown values through', () => {
    const interiorField = carFieldRegistry.find((f) => f.id === 'interior')!
    expect(interiorField.format({ interior: 'ivory' } as CarDetailApi)).toBe('عاجي')
    expect(interiorField.format({ interior: 'custom_shade' } as CarDetailApi)).toBe('custom_shade')
    expect(interiorField.format({ interior: '   ' } as CarDetailApi)).toBeNull()
    expect(interiorField.format({ interior: null } as unknown as CarDetailApi)).toBeNull()
  })

  it('formats field values accurately and returns null (never em-dash) when value is absent', () => {
    const mileageField = carFieldRegistry.find((f) => f.id === 'mileage')!
    expect(mileageField.format({ mileage: 45000 } as CarDetailApi)).toBe('45,000 كم')
    expect(mileageField.format({ mileage: null } as unknown as CarDetailApi)).toBeNull()
    expect(mileageField.format({ mileage: undefined } as unknown as CarDetailApi)).toBeNull()

    const yearField = carFieldRegistry.find((f) => f.id === 'year')!
    expect(yearField.format({ year: 2022 } as CarDetailApi)).toBe('2022')
    expect(yearField.format({ year: null } as unknown as CarDetailApi)).toBeNull()

    const conditionField = carFieldRegistry.find((f) => f.id === 'condition')!
    expect(conditionField.format({ condition: 'USED' } as CarDetailApi)).toBe('مستعمل')
    expect(conditionField.format({ condition: 'NEW' } as CarDetailApi)).toBe('جديد')
    expect(conditionField.format({ condition: null } as unknown as CarDetailApi)).toBeNull()
  })
})
