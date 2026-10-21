import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { BusContractSection } from './BusContractSection'
import { BusContractView } from '../../../types/busDetailViewModel.types'
import { PriceView } from '../../../types/listingDetail.types'

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
    })
  })
})
