import React from 'react'
import fs from 'fs'
import path from 'path'
import { render, fireEvent } from '@testing-library/react-native'
import { ScrollView } from 'react-native'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.setTimeout(20000)

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}))

jest.mock('../api/buses', () => ({
  busesApi: {
    getManufacturers: jest.fn().mockResolvedValue([]),
    getModels: jest.fn().mockResolvedValue([]),
  },
}))

const ROOT = path.resolve(__dirname, '../..')

describe('D-354: Wizard phone-test fixes', () => {
  it('1. shared wizard top padding constant is used by all 5 wizards including parts', () => {
    const { WIZARD_GLASS_HEADER_HEIGHT, getWizardContentPaddingTop } = require('../utils/wizardHelpers')
    expect(WIZARD_GLASS_HEADER_HEIGHT).toBe(52)
    expect(getWizardContentPaddingTop(44)).toBe(44 + 52 + 12)

    for (const wizardFile of [
      'app/cars/new.tsx',
      'app/buses/new.tsx',
      'app/equipment/new.tsx',
      'app/parts/new.tsx',
      'app/services/new.tsx',
    ]) {
      const src = fs.readFileSync(path.join(ROOT, wizardFile), 'utf8')
      expect(src).toMatch(/getWizardContentPaddingTop/)
    }
  })

  it('2. useWizardScrollToTop scrolls ScrollView to y=0 without animation on step change', () => {
    const { useWizardScrollToTop } = require('../hooks/useWizardScrollToTop')
    const scrollToSpy = jest.fn()

    function Harness({ step }: { step: number }) {
      const ref = useWizardScrollToTop(step)
      if (!ref.current) {
        ref.current = { scrollTo: scrollToSpy } as unknown as ScrollView
      }
      return null
    }

    let rendered: any
    rendered = render(<Harness step={1} />)
    return Promise.resolve(rendered).then(async ({ rerender }: any) => {
      scrollToSpy.mockClear()
      await rerender(<Harness step={2} />)
      expect(scrollToSpy).toHaveBeenCalledWith({ y: 0, animated: false })
      scrollToSpy.mockClear()
      await rerender(<Harness step={1} />)
      expect(scrollToSpy).toHaveBeenCalledWith({ y: 0, animated: false })
    })
  })

  it('4. BusStep3Details renders manual-brand action as a clear secondary button >= 44pt', async () => {
    const { BusStep3Details } = require('../components/buses/wizard/BusStep3Details')
    const { getByTestId, getByText } = await render(
      <BusStep3Details
        data={{
          busListingType: 'BUS_SALE',
          busType: 'LARGE_BUS',
          make: '',
          model: '',
          manufacturerId: null,
          modelId: null,
          year: '2022',
          capacity: '50',
          condition: 'USED',
          transmission: 'MANUAL',
          fuelType: 'DIESEL',
          mileage: '',
          plateNumber: '',
          features: [],
          price: '',
          currency: 'OMR',
          isPriceNegotiable: false,
          dailyPrice: '',
          monthlyPrice: '',
          withDriver: false,
          contractType: 'COMPANY',
          contractClient: '',
          contractMonthly: '',
          contractDuration: '',
          contractExpiry: null,
          title: '',
          description: '',
          governorateId: null,
          wilayaId: null,
          governorateNameAr: '',
          wilayaNameAr: '',
          latitude: null,
          longitude: null,
          images: [],
          existingImages: [],
          removedImageIds: [],
          editMode: false,
        }}
        errors={{}}
        onUpdateField={jest.fn()}
      />
    )

    const btn = getByTestId('enable-custom-make-btn')
    expect(getByText('الماركة غير موجودة؟ اكتبها يدوياً')).toBeTruthy()
    const flatStyle = Array.isArray(btn.props.style)
      ? Object.assign({}, ...btn.props.style.filter(Boolean))
      : btn.props.style || {}
    expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44)
    expect(flatStyle.borderWidth).toBeGreaterThanOrEqual(1)
  }, 15000)

  it('5. PublishSuccessView applies safe-area insets on Colors.surface and parts uses unified 3 button labels', async () => {
    const { PublishSuccessView } = require('../components/publish/PublishSuccessView')
    const { Colors } = require('../constants/colors')

    const { getByTestId, getByText } = await render(
      <PublishSuccessView
        primaryAction={{ label: 'عرض الإعلان', onPress: jest.fn() }}
        secondaryAction={{ label: 'إضافة إعلان آخر', onPress: jest.fn() }}
        tertiaryAction={{ label: 'العودة للرئيسية', onPress: jest.fn() }}
      />
    )

    const container = getByTestId('publish-success-view')
    const flatStyle = Array.isArray(container.props.style)
      ? Object.assign({}, ...container.props.style.filter(Boolean))
      : container.props.style || {}
    expect(flatStyle.backgroundColor).toBe(Colors.surface)
    expect(flatStyle.paddingTop).toBe(44)
    expect(flatStyle.paddingBottom).toBe(34)

    const partsSrc = fs.readFileSync(path.join(ROOT, 'app/parts/new.tsx'), 'utf8')
    expect(partsSrc).toContain("label: 'عرض الإعلان'")
    expect(partsSrc).toContain("'إضافة إعلان آخر'")
    expect(partsSrc).toContain("label: 'العودة للرئيسية'")

    // Generic walk: EVERY file under app/ and src/ that renders <PublishSuccessView must NOT apply insets on its wrapper
    const walkTsxFiles = (dir: string): string[] => {
      const results: string[] = []
      if (!fs.existsSync(dir)) return results
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name === '__tests__' || entry.name === '_parked') continue
          results.push(...walkTsxFiles(full))
        } else if (
          /\.(tsx|ts)$/.test(entry.name) &&
          !/\.(spec|test)\.(tsx|ts)$/.test(entry.name)
        ) {
          results.push(full)
        }
      }
      return results
    }

    const callers = [
      ...walkTsxFiles(path.join(ROOT, 'app')),
      ...walkTsxFiles(path.join(ROOT, 'src')),
    ].filter((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8')
      return /<PublishSuccessView\b/.test(content)
    })

    expect(callers.length).toBeGreaterThanOrEqual(7)
    for (const filePath of callers) {
      const rel = path.relative(ROOT, filePath).replace(/\\/g, '/')
      const src = fs.readFileSync(filePath, 'utf8')
      const blockMatch = src.match(/if\s*\(\s*publishSuccess\s*\)\s*\{[\s\S]*?<PublishSuccessView/)
      expect({ rel, hasBlock: Boolean(blockMatch) }).toEqual({ rel, hasBlock: true })
      expect({ rel, hasDoubleInsets: /insets\.top|insets\.bottom/.test(blockMatch![0]) }).toEqual({
        rel,
        hasDoubleInsets: false,
      })
      expect({ rel, usesSuccessRoot: /s\.successRoot/.test(blockMatch![0]) }).toEqual({
        rel,
        usesSuccessRoot: true,
      })
    }
  })

  it('6. BiDi helpers isolate numbers/Latin in placeholders and review titles set writingDirection rtl', () => {
    const { formatRtlPlaceholder } = require('../utils/wizardHelpers')
    const out = formatRtlPlaceholder('مثال: 30')
    expect(out).toContain('\u200F')
    expect(out).toContain('\u206630\u2069')

    const busReviewSrc = fs.readFileSync(
      path.join(ROOT, 'src/components/buses/wizard/BusStep6Review.tsx'),
      'utf8'
    )
    expect(busReviewSrc).toMatch(/writingDirection:\s*'rtl'/)

    const eqStep3Src = fs.readFileSync(
      path.join(ROOT, 'src/components/equipment/wizard/EquipmentStep3Details.tsx'),
      'utf8'
    )
    expect(eqStep3Src).toMatch(/formatRtlPlaceholder\(['"]مثال: 160 HP['"]\)/)
  })

  it('7. CarStep5Review formats CC unit in LTR isolation and EquipmentStep5Review shows power unit', async () => {
    const { CarStep5Review } = require('../components/cars/wizard/CarStep5Review')
    const { EquipmentStep5Review } = require('../components/equipment/wizard/EquipmentStep5Review')

    const carView = await render(
      <CarStep5Review
        formData={{
          listingType: 'SALE',
          title: 'كامري',
          description: 'وصف',
          brandName: 'Toyota',
          modelName: 'Camry',
          year: '2022',
          condition: 'USED',
          mileage: '10000',
          transmission: 'AUTOMATIC',
          fuelType: 'PETROL',
          bodyType: 'SEDAN',
          driveType: 'FWD',
          exteriorColor: 'WHITE',
          engineSize: '2.0',
          horsepower: '200',
          features: [],
          price: '8000',
          isNegotiable: false,
          governorate: 'مسقط',
          city: 'السيب',
          whatsappAvailable: true,
          images: [],
          existingImages: [],
        } as any}
        onGoToStep={jest.fn()}
      />
    )
    expect(carView.getByText('\u20662.0 CC\u2069')).toBeTruthy()

    const eqView = await render(
      <EquipmentStep5Review
        formData={{
          listingType: 'EQUIPMENT_SALE',
          equipmentType: 'EXCAVATOR',
          title: 'حفار',
          description: 'وصف',
          make: 'CAT',
          model: '320D',
          year: '2020',
          condition: 'USED',
          capacity: '',
          power: '1490',
          weight: '',
          hoursUsed: '',
          features: [],
          price: '28000',
          isPriceNegotiable: false,
          governorate: 'مسقط',
          city: 'السيب',
          whatsappEnabled: true,
          images: [],
          existingImages: [],
        } as any}
        onGoToStep={jest.fn()}
      />
    )
    expect(eqView.getByText('1490 حصان')).toBeTruthy()
  })

  it('9. D-351 unused error-dialog imports are removed from wizard screens', () => {
    const carsSrc = fs.readFileSync(path.join(ROOT, 'app/cars/new.tsx'), 'utf8')
    expect(carsSrc).not.toMatch(/getPublishRateLimitErrorMessage/)
    expect(carsSrc).not.toMatch(/getMutationErrorMessage/)

    const busesSrc = fs.readFileSync(path.join(ROOT, 'app/buses/new.tsx'), 'utf8')
    expect(busesSrc).not.toMatch(/getMutationErrorMessage/)

    const eqSrc = fs.readFileSync(path.join(ROOT, 'app/equipment/new.tsx'), 'utf8')
    expect(eqSrc).not.toMatch(/getPublishRateLimitErrorMessage/)
    expect(eqSrc).not.toMatch(/getMutationErrorMessage/)

    const partsSrc = fs.readFileSync(path.join(ROOT, 'app/parts/new.tsx'), 'utf8')
    expect(partsSrc).not.toMatch(/getPublishRateLimitErrorMessage/)
    expect(partsSrc).not.toMatch(/showPublishErrorDialog/)
  })
})
