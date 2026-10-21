import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { BusContractSection } from './BusContractSection'
import { BusLocationMapSection } from './BusLocationMapSection'
import { ListingHeaderBlock } from '../../listing-detail/ListingHeaderBlock'
import { SpecsSections } from '../../listing-detail/SpecsSections'
import { SimilarListingsGrid } from '../../listing-detail/SimilarListingsGrid'
import { SafetyTips } from '../../listing-detail/SafetyTips'
import { SupportButton } from '../../listing-detail/SupportButton'
import { Spacing } from '../../../constants/spacing'
import { BusContractView } from '../../../types/busDetailViewModel.types'
import { PriceView } from '../../../types/listingDetail.types'

interface JsonNode {
  type?: string
  props?: Record<string, any>
  children?: (JsonNode | string)[] | null
}

function collectTextNodes(node: JsonNode | JsonNode[] | string | null): JsonNode[] {
  if (!node || typeof node === 'string') return []
  if (Array.isArray(node)) {
    return node.flatMap((child) => collectTextNodes(child))
  }
  const result: JsonNode[] = []
  if (node.type === 'Text') {
    const flat = StyleSheet.flatten(node.props?.style)
    if (flat?.fontFamily !== 'ionicons') {
      result.push(node)
    }
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      result.push(...collectTextNodes(child))
    }
  }
  return result
}

function findNodeByTestId(node: JsonNode | JsonNode[] | string | null, testID: string): JsonNode | null {
  if (!node || typeof node === 'string') return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNodeByTestId(child, testID)
      if (found) return found
    }
    return null
  }
  if (node.props?.testID === testID) return node
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findNodeByTestId(child, testID)
      if (found) return found
    }
  }
  return null
}

jest.setTimeout(15000)

describe('BusContractSection (Variant C)', () => {
  const refNow = new Date('2026-10-20T12:00:00.000Z')
  const mockLogin = jest.fn()

  const defaultPrice: PriceView = {
    amount: 20000,
    formattedAmount: '20,000',
    currency: 'ر.ع',
    fullPriceLabel: '20,000 ر.ع',
    isNegotiable: false,
    listingType: 'BUS_SALE_WITH_CONTRACT',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Hidden State', () => {
    it('renders null when contract.access is hidden', async () => {
      const contract: BusContractView = { access: 'hidden' }
      const res = await render(
        <BusContractSection
          contract={contract}
          price={defaultPrice}
          busListingType="BUS_SALE"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )
      expect(res.toJSON()).toBeNull()
    })
  })

  describe('Locked State (Guest)', () => {
    const lockedContract: BusContractView = {
      access: 'locked',
      typeLabel: 'نقل مدرسي / جامعي',
    }

    it('renders login prompt and button, and strictly omits any financial/contract numbers', async () => {
      await render(
        <BusContractSection
          contract={lockedContract}
          price={defaultPrice}
          busListingType="BUS_SALE_WITH_CONTRACT"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )

      expect(screen.getByText('عقد التشغيل')).toBeTruthy()
      expect(screen.getByText('نقل مدرسي / جامعي')).toBeTruthy()
      expect(screen.getByText('سجّل الدخول لعرض تفاصيل عقد التشغيل')).toBeTruthy()
      expect(screen.getByText('تسجيل الدخول')).toBeTruthy()

      // Must NOT contain financial or duration numbers
      expect(screen.queryByText(/ر\.ع/)).toBeNull()
      expect(screen.queryByText(/شهر/)).toBeNull()
      expect(screen.queryByText(/الدخل الشهري/)).toBeNull()
      expect(screen.queryByText(/نسبة من السعر/)).toBeNull()
    })

    it('invokes onRequireLogin when login button is pressed', async () => {
      await render(
        <BusContractSection
          contract={lockedContract}
          price={defaultPrice}
          busListingType="BUS_SALE_WITH_CONTRACT"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )

      fireEvent.press(screen.getByText('تسجيل الدخول'))
      expect(mockLogin).toHaveBeenCalledTimes(1)
    })
  })

  describe('Visible State (Authenticated User - Variant C)', () => {
    const visibleContract: BusContractView = {
      access: 'visible',
      typeLabel: 'نقل مدرسي / جامعي',
      clientName: 'وزارة التربية والتعليم',
      withDriver: true,
      monthlyIncome: 600,
      durationMonths: 24,
      expiryIso: '2027-10-20T12:00:00.000Z', // 12 months remaining
    }

    it('renders visible metrics, progress track, disclaimer and toggles accordion', async () => {
      await render(
        <BusContractSection
          contract={visibleContract}
          price={defaultPrice} // 20,000 OMR
          busListingType="BUS_SALE_WITH_CONTRACT"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )

      // Terms
      expect(screen.getByText('عقد التشغيل')).toBeTruthy()
      expect(screen.getAllByText('نقل مدرسي / جامعي').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('وزارة التربية والتعليم')).toBeTruthy()
      expect(screen.getByText('مع سائق')).toBeTruthy()

      // Highlight Metrics (Visible)
      expect(screen.getByText('الدخل الشهري')).toBeTruthy()
      expect(screen.getByText(/600/)).toBeTruthy()
      expect(screen.getByText('الدخل المتبقي من العقد')).toBeTruthy()
      expect(screen.getByText(/7,200/)).toBeTruthy()
      expect(screen.getByText(/نسبة من السعر: 36%/)).toBeTruthy()

      // End date and progress bar
      expect(screen.getByText(/المدة المنقضية من العقد \(ينتهي 2027\/10\/20\)/)).toBeTruthy()
      expect(screen.getByText('50%')).toBeTruthy()

      // Mandatory Disclaimer Note
      expect(
        screen.getByText('تقدير مبني على إجمالي دخل العقد المتبقي، ولا يشمل التكاليف التشغيلية')
      ).toBeTruthy()

      // Accordion is initially collapsed
      expect(screen.queryByTestId('contract-accordion-body')).toBeNull()

      // Toggle accordion open
      const toggleBtn = screen.getByTestId('btn-toggle-contract-accordion')
      const toggleBtnStyle = StyleSheet.flatten(toggleBtn.props.style)
      expect(toggleBtnStyle?.minHeight).toBeGreaterThanOrEqual(Spacing.touch)
      await fireEvent.press(toggleBtn)

      // Extra metrics visible inside accordion
      expect(screen.getByTestId('contract-accordion-body')).toBeTruthy()
      expect(screen.getByText('العائد السنوي*')).toBeTruthy()
      expect(screen.getByText('36%')).toBeTruthy()
      expect(screen.getByText('(600 × 12 ÷ 20,000)')).toBeTruthy()
      expect(screen.getByText('مدة السداد*')).toBeTruthy()
      expect(screen.getByText('34 شهر')).toBeTruthy()
      expect(screen.getByText('(20,000 ÷ 600)')).toBeTruthy()
      expect(screen.getByText('* بافتراض تجديد العقد بنفس الدخل الشهري.')).toBeTruthy()

      // Toggle closed
      await fireEvent.press(toggleBtn)
      expect(screen.queryByTestId('contract-accordion-body')).toBeNull()
    })

    it('guarantees zero occurrences of forbidden words (ربح, مضمون, etc.) in the tree', async () => {
      const { toJSON } = await render(
        <BusContractSection
          contract={visibleContract}
          price={defaultPrice}
          busListingType="BUS_SALE_WITH_CONTRACT"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )

      const tree = JSON.stringify(toJSON())
      expect(tree).not.toMatch(/ربح|أرباح|مضمون|ممتاز|فرصة/)
    })

    it('omits recoveryPercent, annualYield, and payback metrics on BUS_RENT listings', async () => {
      await render(
        <BusContractSection
          contract={visibleContract}
          price={{ ...defaultPrice, listingType: 'BUS_RENT' }}
          busListingType="BUS_RENT"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )

      // Remaining income tile is shown
      expect(screen.getByText('الدخل المتبقي من العقد')).toBeTruthy()
      // But purchase price metrics and accordion must NOT be present
      expect(screen.queryByText(/نسبة من السعر/)).toBeNull()
      expect(screen.queryByTestId('btn-toggle-contract-accordion')).toBeNull()
    })
    it('renders em dash when remaining income is null', async () => {
      const contractWithoutDates: BusContractView = {
        access: 'visible',
        typeLabel: 'عقد حكومي',
        withDriver: true,
        monthlyIncome: 500,
      }
      await render(
        <BusContractSection
          contract={contractWithoutDates}
          price={defaultPrice}
          busListingType="BUS_SALE_WITH_CONTRACT"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )

      expect(screen.getByText('—')).toBeTruthy()
      expect(screen.queryByTestId('contract-percent-ring')).toBeNull()
    })

    it('renders metric box icons, centered texts, and ContractPercentRing when recoveryPercent exists', async () => {
      const { toJSON } = await render(
        <BusContractSection
          contract={visibleContract}
          price={defaultPrice}
          busListingType="BUS_SALE_WITH_CONTRACT"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )

      // Top-level metric box icons
      expect(screen.getByTestId('contract-icon-monthly')).toBeTruthy()
      expect(screen.getByTestId('contract-icon-remaining')).toBeTruthy()

      // Percent ring rendered with 36% label for sale contract
      const ring = screen.getByTestId('contract-percent-ring')
      expect(ring).toBeTruthy()
      expect(ring.props.accessibilityLabel).toBe('نسبة من السعر 36%')

      // Verify all Text elements inside both metric boxes have textAlign: 'center'
      const tree = toJSON() as JsonNode | null
      const monthlyBox = findNodeByTestId(tree, 'contract-metric-monthly')
      const remainingBox = findNodeByTestId(tree, 'contract-metric-remaining')
      expect(monthlyBox).toBeTruthy()
      expect(remainingBox).toBeTruthy()
      for (const box of [monthlyBox!, remainingBox!]) {
        const boxStyle = StyleSheet.flatten(box.props?.style)
        expect(boxStyle?.alignItems).toBe('center')
        const texts = collectTextNodes(box)
        expect(texts.length).toBeGreaterThan(0)
        for (const t of texts) {
          const st = StyleSheet.flatten(t.props?.style)
          expect(st?.textAlign).toBe('center')
        }
      }

      // Open accordion and verify extra metric box icons and centered texts
      await fireEvent.press(screen.getByTestId('btn-toggle-contract-accordion'))
      expect(screen.getByTestId('contract-icon-yield')).toBeTruthy()
      expect(screen.getByTestId('contract-icon-payback')).toBeTruthy()
    })
  })

  describe('Typography & LineHeight Regression (Almarai + >=11pt floor + lineHeight >= 1.5x fontSize)', () => {
    interface TextCheckTarget {
      node: JsonNode
      isNestedInText: boolean
    }

    const collectTextTargets = (
      node: JsonNode | JsonNode[] | string | null,
      isNestedInText = false
    ): TextCheckTarget[] => {
      if (!node || typeof node === 'string') return []
      if (Array.isArray(node)) {
        return node.flatMap((child) => collectTextTargets(child, isNestedInText))
      }
      const result: TextCheckTarget[] = []
      const isText = node.type === 'Text'

      if (isText) {
        const flat = node.props?.style ? StyleSheet.flatten(node.props.style) : undefined
        if (flat?.fontFamily !== 'ionicons') {
          result.push({ node, isNestedInText })
        }
      }

      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          result.push(...collectTextTargets(child, isNestedInText || isText))
        }
      }

      return result
    }

    const assertAllTextsUseAlmaraiAndSafeLineHeight = (tree: JsonNode | JsonNode[] | null) => {
      const targets = collectTextTargets(tree)
      expect(targets.length).toBeGreaterThan(0)

      for (const { node, isNestedInText } of targets) {
        const flat = node.props?.style ? StyleSheet.flatten(node.props.style) : undefined

        if (isNestedInText) {
          // Legitimate exception: a Text nested inside another Text inherits the parent's font.
          // Skip only if it defines no own fontFamily and no own fontSize.
          if (flat && (flat.fontFamily !== undefined || flat.fontSize !== undefined)) {
            expect(flat.fontSize).toBeDefined()
            expect(typeof flat.fontSize).toBe('number')
            expect(flat.fontSize as number).toBeGreaterThanOrEqual(11)
            expect(String(flat.fontFamily ?? '')).toMatch(/^Almarai_/)
            expect(typeof flat.lineHeight).toBe('number')
            expect(flat.lineHeight as number).toBeGreaterThanOrEqual((flat.fontSize as number) * 1.5)
          }
          continue
        }

        // Top-level Text: must have style, explicit numeric fontSize >= 11, Almarai fontFamily, and lineHeight >= 1.5x fontSize.
        expect(node.props?.style).toBeDefined()
        expect(flat).toBeDefined()
        expect(typeof flat?.fontSize).toBe('number')
        expect(flat!.fontSize as number).toBeGreaterThanOrEqual(11)
        expect(String(flat?.fontFamily ?? '')).toMatch(/^Almarai_/)
        expect(typeof flat?.lineHeight).toBe('number')
        expect(flat!.lineHeight as number).toBeGreaterThanOrEqual(flat!.fontSize! * 1.5)
      }
    }

    it('enforces Almarai fontFamily, >= 11pt floor, and lineHeight >= 1.5x fontSize on all Texts in visible BusContractSection (including expanded accordion)', async () => {
      const visibleContract: BusContractView = {
        access: 'visible',
        typeLabel: 'نقل مدرسي / جامعي',
        clientName: 'وزارة التربية والتعليم',
        withDriver: true,
        monthlyIncome: 600,
        durationMonths: 24,
        expiryIso: '2027-10-20T12:00:00.000Z',
      }
      const view = await render(
        <BusContractSection
          contract={visibleContract}
          price={defaultPrice}
          busListingType="BUS_SALE_WITH_CONTRACT"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )
      await fireEvent.press(screen.getByTestId('btn-toggle-contract-accordion'))
      assertAllTextsUseAlmaraiAndSafeLineHeight(view.toJSON() as JsonNode | null)
    })

    it('enforces Almarai fontFamily, >= 11pt floor, and lineHeight >= 1.5x fontSize on all Texts in locked BusContractSection', async () => {
      const lockedContract: BusContractView = {
        access: 'locked',
        typeLabel: 'نقل مدرسي / جامعي',
      }
      const view = await render(
        <BusContractSection
          contract={lockedContract}
          price={defaultPrice}
          busListingType="BUS_SALE_WITH_CONTRACT"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )
      assertAllTextsUseAlmaraiAndSafeLineHeight(view.toJSON() as JsonNode | null)
    })

    it('enforces Almarai fontFamily, >= 11pt floor, and lineHeight >= 1.5x fontSize on all Texts in BusLocationMapSection', async () => {
      const view = await render(
        <BusLocationMapSection
          latitude={23.588}
          longitude={58.3829}
          isMapMounted={false}
        />
      )
      assertAllTextsUseAlmaraiAndSafeLineHeight(view.toJSON() as JsonNode | null)
    })

    it('enforces Almarai, >= 11pt floor, and Impeccable polish rules on ListingHeaderBlock, SpecsSections, SimilarListingsGrid, SafetyTips, and SupportButton', async () => {
      const headerView = await render(
        <ListingHeaderBlock
          title="تويوتا كوستر 2024 للبيع"
          kindLabel="للإيجار"
          conditionLabel="مستعمل"
          price={{
            amount: 25000,
            formattedAmount: '25,000',
            currency: 'ر.ع',
            fullPriceLabel: '25,000 ر.ع',
            isNegotiable: true,
            listingType: 'RENTAL',
            dailyRate: { amount: 45, formatted: '45', label: '45 ر.ع / يوم' },
            monthlyRate: { amount: 650, formatted: '650', label: '650 ر.ع / شهر' },
          }}
          locationText="مسقط، السيب"
          postedAtLabel="منذ ساعتين"
          statusBadge={{ label: 'تم التأجير', tone: 'warning' }}
        />
      )
      assertAllTextsUseAlmaraiAndSafeLineHeight(headerView.toJSON() as JsonNode | null)

      const saleHeaderView = await render(
        <ListingHeaderBlock
          title="تويوتا كوستر 2024 للبيع"
          kindLabel="للبيع"
          conditionLabel="مستعمل"
          price={{
            amount: 25000,
            formattedAmount: '25,000',
            currency: 'ر.ع',
            fullPriceLabel: '25,000 ر.ع',
            isNegotiable: true,
            listingType: 'SALE',
          }}
          locationText="مسقط، السيب"
          postedAtLabel="منذ ساعتين"
          statusBadge={{ label: 'تم البيع', tone: 'danger' }}
        />
      )
      const negotiableNode = screen.getByText('قابل للتفاوض')
      const negotiableStyle = StyleSheet.flatten(negotiableNode.props.style)
      expect(negotiableStyle?.fontSize).toBeGreaterThanOrEqual(11)
      expect(negotiableStyle?.lineHeight).toBeGreaterThanOrEqual(negotiableStyle!.fontSize! * 1.5)
      expect(negotiableStyle?.writingDirection).toBe('rtl')

      const specsView = await render(
        <SpecsSections
          sections={[
            {
              title: 'المواصفات الفنية',
              items: [{ key: 'capacity', label: 'السعة', value: '30 راكب' }],
            },
            {
              title: 'المميزات',
              items: [{ key: 'ac', label: 'مكيف هواء', value: '' }],
            },
          ]}
        />
      )
      assertAllTextsUseAlmaraiAndSafeLineHeight(specsView.toJSON() as JsonNode | null)
      expect(JSON.stringify(specsView.toJSON())).not.toMatch(/#059669|#F0FDF4|#BBF7D0|#166534/i)

      const safetyView = await render(
        <SafetyTips
          role="buyer"
          title="نصائح الأمان للمشتري"
          tips={['عاين المركبة شخصياً قبل الدفع']}
        />
      )
      assertAllTextsUseAlmaraiAndSafeLineHeight(safetyView.toJSON() as JsonNode | null)
      expect(JSON.stringify(safetyView.toJSON())).not.toMatch(/#FEFCE8|#FEF08A/i)

      const similarErrView = await render(
        <SimilarListingsGrid
          items={[]}
          isLoading={false}
          isError={true}
          onRetry={jest.fn()}
          renderItem={() => <></>}
          page={1}
          pageCount={2}
          onPageChange={jest.fn()}
        />
      )
      assertAllTextsUseAlmaraiAndSafeLineHeight(similarErrView.toJSON() as JsonNode | null)
      const retryBtn = screen.getByTestId('btn-similar-retry')
      expect(StyleSheet.flatten(retryBtn.props.style)?.minHeight).toBeGreaterThanOrEqual(Spacing.touch)

      const supportView = await render(<SupportButton onPress={jest.fn()} />)
      assertAllTextsUseAlmaraiAndSafeLineHeight(supportView.toJSON() as JsonNode | null)
    })
  })
})
