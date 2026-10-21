import { computeBusContractEstimate, BusContractEstimateInput } from './computeBusContractEstimate'

describe('computeBusContractEstimate', () => {
  const refNow = new Date('2026-10-20T12:00:00.000Z')

  describe('Standard Sale with Contract', () => {
    it('computes all metrics correctly for BUS_SALE_WITH_CONTRACT with valid price and expiry', () => {
      // 2026-10-20 to 2027-10-20 is exactly 365 days (~12 months).
      // 365 / 30.4375 = 11.9917 -> ceil = 12 months.
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 24000,
        monthlyIncome: 600,
        expiryIso: '2027-10-20T12:00:00.000Z',
      }

      const res = computeBusContractEstimate(input, refNow)

      expect(res.monthlyIncome).toBe(600)
      expect(res.annualIncome).toBe(7200)
      expect(res.remainingMonths).toBe(12)
      expect(res.remainingIncome).toBe(7200) // 600 * 12
      expect(res.recoveryPercent).toBe(30) // 7200 / 24000 * 100 = 30%
      expect(res.annualYieldPercent).toBe(30.0) // 7200 / 24000 * 100 = 30.0%
      expect(res.paybackMonths).toBe(40) // ceil(24000 / 600) = 40 months
    })

    it('works identically for BUS_SALE with contract data', () => {
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE',
        price: 20000,
        monthlyIncome: 500,
        expiryIso: '2027-04-20T12:00:00.000Z', // ~6 months
      }

      const res = computeBusContractEstimate(input, refNow)

      expect(res.monthlyIncome).toBe(500)
      expect(res.annualIncome).toBe(6000)
      expect(res.remainingMonths).toBe(6)
      expect(res.remainingIncome).toBe(3000)
      expect(res.recoveryPercent).toBe(15) // 3000 / 20000 * 100
      expect(res.annualYieldPercent).toBe(30.0)
      expect(res.paybackMonths).toBe(40)
    })
  })

  describe('Rental Listings (BUS_RENT)', () => {
    it('returns null for recoveryPercent, annualYieldPercent, and paybackMonths on BUS_RENT', () => {
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_RENT',
        price: 15000,
        monthlyIncome: 450,
        expiryIso: '2027-10-20T12:00:00.000Z',
      }

      const res = computeBusContractEstimate(input, refNow)

      expect(res.monthlyIncome).toBe(450)
      expect(res.annualIncome).toBe(5400)
      expect(res.remainingMonths).toBe(12)
      expect(res.remainingIncome).toBe(5400)
      // Rental listings MUST NOT calculate purchase price metrics
      expect(res.recoveryPercent).toBeNull()
      expect(res.annualYieldPercent).toBeNull()
      expect(res.paybackMonths).toBeNull()
    })
  })

  describe('Zero / Missing Price Scenarios', () => {
    it('returns null for price-dependent metrics when price is 0', () => {
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 0,
        monthlyIncome: 500,
        expiryIso: '2027-10-20T12:00:00.000Z',
      }

      const res = computeBusContractEstimate(input, refNow)

      expect(res.recoveryPercent).toBeNull()
      expect(res.annualYieldPercent).toBeNull()
      expect(res.paybackMonths).toBeNull()
    })

    it('returns null for price-dependent metrics when price is undefined or negative', () => {
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: -5000,
        monthlyIncome: 500,
        durationMonths: 10,
      }

      const res = computeBusContractEstimate(input, refNow)

      expect(res.recoveryPercent).toBeNull()
      expect(res.annualYieldPercent).toBeNull()
      expect(res.paybackMonths).toBeNull()
    })
  })

  describe('Remaining Months Edge Cases', () => {
    it('returns remainingMonths = 1 when fewer than 30 days remain (positive fraction)', () => {
      // 10 days remaining
      const expiry = new Date(refNow.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 10000,
        monthlyIncome: 400,
        expiryIso: expiry,
      }

      const res = computeBusContractEstimate(input, refNow)

      expect(res.remainingMonths).toBe(1)
      expect(res.remainingIncome).toBe(400)
    })

    it('returns remainingMonths = 0, remainingIncome = 0, recoveryPercent = 0 when contract expired', () => {
      // Expired yesterday
      const expiry = new Date(refNow.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 10000,
        monthlyIncome: 500,
        expiryIso: expiry,
      }

      const res = computeBusContractEstimate(input, refNow)

      expect(res.remainingMonths).toBe(0)
      expect(res.remainingIncome).toBe(0)
      expect(res.recoveryPercent).toBe(0)
    })

    it('returns remainingMonths = 0 when expiry is exactly now', () => {
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 10000,
        monthlyIncome: 500,
        expiryIso: refNow.toISOString(),
      }

      const res = computeBusContractEstimate(input, refNow)

      expect(res.remainingMonths).toBe(0)
      expect(res.remainingIncome).toBe(0)
      expect(res.recoveryPercent).toBe(0)
    })

    it('falls back to durationMonths when expiryIso is missing', () => {
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 12000,
        monthlyIncome: 600,
        durationMonths: 18,
      }

      const res = computeBusContractEstimate(input, refNow)

      expect(res.remainingMonths).toBe(18)
      expect(res.remainingIncome).toBe(10800) // 600 * 18
      expect(res.recoveryPercent).toBe(90) // 10800 / 12000 * 100
    })

    it('returns null for remainingMonths and remainingIncome when neither expiryIso nor durationMonths exists', () => {
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 12000,
        monthlyIncome: 600,
      }

      const res = computeBusContractEstimate(input, refNow)

      expect(res.remainingMonths).toBeNull()
      expect(res.remainingIncome).toBeNull()
      expect(res.recoveryPercent).toBeNull()
      // annualYieldPercent and paybackMonths can still be calculated
      expect(res.annualYieldPercent).toBe(60.0)
      expect(res.paybackMonths).toBe(20)
    })
  })

  describe('No Artificial Ceiling on Recovery Percent', () => {
    it('allows recoveryPercent > 100% when remaining income exceeds the price', () => {
      // remaining income = 600 * 24 = 14,400. price = 10,000 -> recovery = 144%
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 10000,
        monthlyIncome: 600,
        durationMonths: 24,
      }

      const res = computeBusContractEstimate(input, refNow)

      expect(res.recoveryPercent).toBe(144)
      expect(res.recoveryPercent).toBeGreaterThan(100)
    })
  })

  describe('Invalid Inputs Handling', () => {
    it('returns zero/null safely without NaN when monthlyIncome is <= 0 or invalid', () => {
      const inputs: any[] = [
        { busListingType: 'BUS_SALE_WITH_CONTRACT', monthlyIncome: 0 },
        { busListingType: 'BUS_SALE_WITH_CONTRACT', monthlyIncome: -100 },
        { busListingType: 'BUS_SALE_WITH_CONTRACT', monthlyIncome: NaN },
        { busListingType: 'BUS_SALE_WITH_CONTRACT', monthlyIncome: null },
        { busListingType: 'BUS_SALE_WITH_CONTRACT', monthlyIncome: undefined },
      ]

      for (const input of inputs) {
        const res = computeBusContractEstimate(input, refNow)
        expect(res.monthlyIncome).toBe(0)
        expect(res.annualIncome).toBe(0)
        expect(res.remainingMonths).toBeNull()
        expect(res.remainingIncome).toBeNull()
        expect(res.recoveryPercent).toBeNull()
        expect(res.annualYieldPercent).toBeNull()
        expect(res.paybackMonths).toBeNull()
        expect(Number.isNaN(res.monthlyIncome)).toBe(false)
      }
    })
  })

  describe('Determinism', () => {
    it('yields identical outputs given the same inputs and reference date', () => {
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 18000,
        monthlyIncome: 750,
        expiryIso: '2028-01-01T00:00:00.000Z',
      }

      const res1 = computeBusContractEstimate(input, refNow)
      const res2 = computeBusContractEstimate(input, refNow)

      expect(res1).toEqual(res2)
    })
  })

  describe('Contract Duration Progress Percent', () => {
    it('computes elapsed progress percent correctly when durationMonths and remainingMonths exist', () => {
      // 24 months total duration, 6 months remaining -> elapsed 18 months -> 18/24 = 75%
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 18000,
        monthlyIncome: 450,
        durationMonths: 24,
        expiryIso: '2027-04-20T12:00:00.000Z', // ~6 months
      }

      const res = computeBusContractEstimate(input, refNow)
      expect(res.progressPercent).toBe(75)
    })

    it('returns 100% progress when contract is fully expired', () => {
      const expiry = new Date(refNow.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 18000,
        monthlyIncome: 450,
        durationMonths: 12,
        expiryIso: expiry,
      }

      const res = computeBusContractEstimate(input, refNow)
      expect(res.progressPercent).toBe(100)
    })

    it('returns null when durationMonths is missing or non-positive', () => {
      const input: BusContractEstimateInput = {
        busListingType: 'BUS_SALE_WITH_CONTRACT',
        price: 18000,
        monthlyIncome: 450,
      }

      const res = computeBusContractEstimate(input, refNow)
      expect(res.progressPercent).toBeNull()
    })
  })
})
