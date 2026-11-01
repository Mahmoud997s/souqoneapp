import {
  getCardPriceNegotiable,
  getCardSellerVerified,
  CardItemLike,
} from '../../utils/cardItemHelpers'

describe('D-174b: Type Holes & Card Item Helpers', () => {
  describe('getCardPriceNegotiable - table-driven tests', () => {
    interface TestCase {
      description: string
      input: CardItemLike | null | undefined
      expected: boolean | undefined
    }

    const testCases: TestCase[] = [
      {
        description: '1. Field on item only (true)',
        input: { isPriceNegotiable: true },
        expected: true,
      },
      {
        description: '1. Field on item only (false)',
        input: { isPriceNegotiable: false },
        expected: false,
      },
      {
        description: '2. Field only on raw (true)',
        input: { raw: { isPriceNegotiable: true } },
        expected: true,
      },
      {
        description: '2. Field only on raw (false)',
        input: { raw: { isPriceNegotiable: false } },
        expected: false,
      },
      {
        description: '3. Field on both (item=false, raw=true -> item precedence)',
        input: { isPriceNegotiable: false, raw: { isPriceNegotiable: true } },
        expected: false,
      },
      {
        description: '3. Field on both (item=true, raw=false -> item precedence)',
        input: { isPriceNegotiable: true, raw: { isPriceNegotiable: false } },
        expected: true,
      },
      {
        description: '4. Field absent on both',
        input: { raw: {} },
        expected: undefined,
      },
      {
        description: '4. Field absent on both (no raw object)',
        input: {},
        expected: undefined,
      },
      {
        description: 'Edge case: null input',
        input: null,
        expected: undefined,
      },
      {
        description: 'Edge case: undefined input',
        input: undefined,
        expected: undefined,
      },
    ]

    testCases.forEach(({ description, input, expected }) => {
      it(description, () => {
        expect(getCardPriceNegotiable(input)).toBe(expected)
      })
    })
  })

  describe('getCardSellerVerified - table-driven tests', () => {
    interface TestCase {
      description: string
      input: CardItemLike | null | undefined
      expected: boolean
    }

    const testCases: TestCase[] = [
      {
        description: '1. Field on item only (true)',
        input: { isVerified: true },
        expected: true,
      },
      {
        description: '1. Field on item only (false)',
        input: { isVerified: false },
        expected: false,
      },
      {
        description: '2. Field only on raw (true)',
        input: { raw: { isVerified: true } },
        expected: true,
      },
      {
        description: '2. Field only on raw user (true)',
        input: { raw: { user: { isVerified: true } } },
        expected: true,
      },
      {
        description: '2. Field only on raw seller (true)',
        input: { raw: { seller: { isVerified: true } } },
        expected: true,
      },
      {
        description: '3. Field on both (item=false, raw.isVerified=true -> item precedence)',
        input: { isVerified: false, raw: { isVerified: true } },
        expected: false,
      },
      {
        description: '3. Field on both (item=true, raw.isVerified=false -> item precedence)',
        input: { isVerified: true, raw: { isVerified: false } },
        expected: true,
      },
      {
        description: '3. Hierarchy precedence (raw.user over raw.seller)',
        input: {
          raw: {
            user: { isVerified: false },
            seller: { isVerified: true },
          },
        },
        expected: false,
      },
      {
        description: '4. Field absent on all',
        input: { raw: { user: {}, seller: {} } },
        expected: false,
      },
      {
        description: '4. Empty item',
        input: {},
        expected: false,
      },
      {
        description: 'Edge case: null input',
        input: null,
        expected: false,
      },
      {
        description: 'Edge case: undefined input',
        input: undefined,
        expected: false,
      },
    ]

    testCases.forEach(({ description, input, expected }) => {
      it(description, () => {
        expect(getCardSellerVerified(input)).toBe(expected)
      })
    })
  })

  describe('Parity across the 4 card types (Car, Bus, Equip, Service)', () => {
    const inputShapes: CardItemLike[] = [
      { isPriceNegotiable: true, isVerified: true },
      { raw: { isPriceNegotiable: true, isVerified: true, user: { isVerified: false } } },
      {
        isPriceNegotiable: false,
        isVerified: false,
        raw: { isPriceNegotiable: true, isVerified: true },
      },
      { raw: {} },
    ]

    it('CarCard: matches old inline isPriceNegotiable logic', () => {
      inputShapes.forEach((item) => {
        const rawData = (item as any).raw || item
        const oldLogicSale = Boolean(true && ((item as any).isPriceNegotiable ?? rawData.isPriceNegotiable))
        const oldLogicNotSale = Boolean(false && ((item as any).isPriceNegotiable ?? rawData.isPriceNegotiable))

        const newLogicSale = Boolean(true && getCardPriceNegotiable(item))
        const newLogicNotSale = Boolean(false && getCardPriceNegotiable(item))

        expect(newLogicSale).toBe(oldLogicSale)
        expect(newLogicNotSale).toBe(oldLogicNotSale)
      })
    })

    it('BusCard: matches old inline isPriceNegotiable logic', () => {
      inputShapes.forEach((item) => {
        const rawData = (item as any).raw || item
        const oldLogic = Boolean(true && ((item as any).isPriceNegotiable ?? rawData.isPriceNegotiable))
        const newLogic = Boolean(true && getCardPriceNegotiable(item))
        expect(newLogic).toBe(oldLogic)
      })
    })

    it('EquipCard: matches old inline isPriceNegotiable logic', () => {
      inputShapes.forEach((item) => {
        const rawData = (item as any).raw || item
        const oldLogic = Boolean(true && ((item as any).isPriceNegotiable ?? rawData.isPriceNegotiable))
        const newLogic = Boolean(true && getCardPriceNegotiable(item))
        expect(newLogic).toBe(oldLogic)
      })
    })

    it('ServiceCard: matches old inline isSellerVerified logic', () => {
      inputShapes.forEach((item) => {
        const rawData = (item as any).raw || item
        const oldLogic =
          (item as any).isVerified ??
          rawData.isVerified ??
          rawData.user?.isVerified ??
          rawData.seller?.isVerified ??
          false

        const newLogic = getCardSellerVerified(item)
        expect(newLogic).toBe(Boolean(oldLogic))
      })
    })
  })
})
