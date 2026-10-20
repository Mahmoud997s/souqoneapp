import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { BusContractSection } from './BusContractSection'
import { BusContractView } from '../../../types/busDetailViewModel.types'
import { PriceView } from '../../../types/listingDetail.types'

jest.setTimeout(15000)

describe('BusContractSection', () => {
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
      expect(screen.queryByText(/نسبة الاسترداد/)).toBeNull()
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

  describe('Visible State (Authenticated User)', () => {
    const visibleContract: BusContractView = {
      access: 'visible',
      typeLabel: 'نقل مدرسي / جامعي',
      clientName: 'وزارة التربية والتعليم',
      withDriver: true,
      monthlyIncome: 600,
      durationMonths: 24,
      expiryIso: '2027-10-20T12:00:00.000Z', // 12 months remaining
    }

    it('renders contract terms, computed financial metrics, and mandatory disclaimer note', async () => {
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
      expect(screen.getByText('600 ر.ع')).toBeTruthy()
      expect(screen.getByText('24 شهر')).toBeTruthy()
      expect(screen.getByText('2027/10/20')).toBeTruthy()

      // Financial Estimates (12 months remaining -> 7,200 OMR -> recovery = 36%)
      expect(screen.getByText('إجمالي الدخل المتبقي')).toBeTruthy()
      expect(screen.getByText('7,200 ر.ع')).toBeTruthy()
      expect(screen.getByText('نسبة الاسترداد: 36%')).toBeTruthy()
      expect(screen.getByText('العائد السنوي')).toBeTruthy()
      expect(screen.getByText('36%')).toBeTruthy()
      expect(screen.getByText('مدة السداد')).toBeTruthy()
      expect(screen.getByText('34 شهر')).toBeTruthy() // ceil(20000 / 600) = 34

      // Mandatory Disclaimer Note
      expect(
        screen.getByText('تقدير مبني على إجمالي دخل العقد المتبقي، ولا يشمل التكاليف التشغيلية')
      ).toBeTruthy()
    })

    it('guarantees zero occurrences of forbidden words (ربح, مضمون, etc.) in the tree', async () => {
      await render(
        <BusContractSection
          contract={visibleContract}
          price={defaultPrice}
          busListingType="BUS_SALE_WITH_CONTRACT"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )

      expect(screen.queryByText(/ربح|أرباح|مضمون|ممتاز|فرصة/)).toBeNull()
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

      // Remaining income tile is still shown because contract has remaining duration
      expect(screen.getByText('إجمالي الدخل المتبقي')).toBeTruthy()
      // But purchase price metrics must NOT be present
      expect(screen.queryByText(/نسبة الاسترداد/)).toBeNull()
      expect(screen.queryByText('العائد السنوي')).toBeNull()
      expect(screen.queryByText('مدة السداد')).toBeNull()
    })

    it('omits expiry row when expiryIso is not provided', async () => {
      const contractNoExpiry: BusContractView = {
        ...visibleContract,
        expiryIso: undefined,
      }

      await render(
        <BusContractSection
          contract={contractNoExpiry}
          price={defaultPrice}
          busListingType="BUS_SALE_WITH_CONTRACT"
          onRequireLogin={mockLogin}
          now={refNow}
        />
      )

      expect(screen.queryByText('تاريخ الانتهاء')).toBeNull()
    })
  })
})
