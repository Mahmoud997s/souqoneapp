import { parseListEnvelope, ListContractError } from '../../utils/parseListEnvelope'

describe('parseListEnvelope (S1 List Contract Utility)', () => {
  describe('Valid shapes', () => {
    it('accepts a documented plain array fixture (conversations / non-paginated lists)', () => {
      const fixture = [{ id: 'conv-1' }, { id: 'conv-2' }]
      const result = parseListEnvelope<{ id: string }>(fixture)

      expect(result).toEqual({
        items: fixture,
        meta: undefined,
        hasNextPage: false,
      })
    })

    it('accepts a documented { items, meta } fixture with complete pagination fields', () => {
      const fixture = {
        items: [{ id: 'part-1', name: 'Brake Pad' }],
        meta: { total: 25, page: 1, limit: 10, totalPages: 3 },
      }
      const result = parseListEnvelope<{ id: string; name: string }>(fixture)

      expect(result).toEqual({
        items: fixture.items,
        meta: { total: 25, page: 1, limit: 10, totalPages: 3 },
        hasNextPage: true,
      })
    })

    it('accepts a truly empty plain array [] as valid', () => {
      const result = parseListEnvelope([])
      expect(result).toEqual({
        items: [],
        meta: undefined,
        hasNextPage: false,
      })
    })

    it('accepts a truly empty items: [] without meta as valid', () => {
      const result = parseListEnvelope({ items: [] })
      expect(result).toEqual({
        items: [],
        meta: undefined,
        hasNextPage: false,
      })
    })

    it('accepts a truly empty items: [] with zero-total meta (empty search/category)', () => {
      const fixture = {
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      }
      const result = parseListEnvelope(fixture)
      expect(result).toEqual({
        items: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
        hasNextPage: false,
      })
    })
  })

  describe('Contract violations and invalid shapes (throws ListContractError)', () => {
    it('throws ListContractError when payload is null or undefined', () => {
      expect(() => parseListEnvelope(null)).toThrow(ListContractError)
      expect(() => parseListEnvelope(null)).toThrow('Response payload is null or undefined')
      expect(() => parseListEnvelope(undefined)).toThrow(ListContractError)
    })

    it('throws ListContractError when payload is a primitive (string, number, boolean)', () => {
      expect(() => parseListEnvelope('not-a-list')).toThrow(ListContractError)
      expect(() => parseListEnvelope(12345)).toThrow(ListContractError)
      expect(() => parseListEnvelope(false)).toThrow(ListContractError)
    })

    it('throws ListContractError when items property is missing from envelope object', () => {
      const fixtureMissingItems = { meta: { total: 10, page: 1, limit: 10, totalPages: 1 } }
      expect(() => parseListEnvelope(fixtureMissingItems)).toThrow(ListContractError)
      expect(() => parseListEnvelope(fixtureMissingItems)).toThrow('Response object missing "items" array')
      expect(() => parseListEnvelope({})).toThrow(ListContractError)
    })

    it('throws ListContractError when legacy { data } envelope is provided (no {data} alias allowed)', () => {
      const legacyDataEnvelope = { data: [{ id: 'part-1' }], total: 1, page: 1, limit: 10, totalPages: 1 }
      expect(() => parseListEnvelope(legacyDataEnvelope)).toThrow(ListContractError)
      expect(() => parseListEnvelope(legacyDataEnvelope)).toThrow('Response object missing "items" array')
    })

    it('throws ListContractError when items is not an array (object, string, number, null)', () => {
      expect(() => parseListEnvelope({ items: { id: 'part-1' } })).toThrow(ListContractError)
      expect(() => parseListEnvelope({ items: { id: 'part-1' } })).toThrow('Expected "items" to be an array')
      expect(() => parseListEnvelope({ items: 'single-item' })).toThrow(ListContractError)
      expect(() => parseListEnvelope({ items: 42 })).toThrow(ListContractError)
      expect(() => parseListEnvelope({ items: null })).toThrow(ListContractError)
    })

    it('throws ListContractError when meta is not an object or is null/array', () => {
      expect(() => parseListEnvelope({ items: [], meta: null })).toThrow(ListContractError)
      expect(() => parseListEnvelope({ items: [], meta: null })).toThrow('Malformed pagination meta: expected an object')
      expect(() => parseListEnvelope({ items: [], meta: 'meta-string' })).toThrow(ListContractError)
      expect(() => parseListEnvelope({ items: [], meta: [1, 2, 3] })).toThrow(ListContractError)
    })

    it('throws ListContractError when meta fields are invalid numbers or negative', () => {
      expect(() => parseListEnvelope({ items: [], meta: { total: -1, page: 1, limit: 10, totalPages: 1 } })).toThrow(ListContractError)
      expect(() => parseListEnvelope({ items: [], meta: { total: 10, page: 0, limit: 10, totalPages: 1 } })).toThrow(ListContractError)
      expect(() => parseListEnvelope({ items: [], meta: { total: 10, page: 1, limit: 0, totalPages: 1 } })).toThrow(ListContractError)
      expect(() => parseListEnvelope({ items: [], meta: { total: 10, page: 1, limit: 10, totalPages: -1 } })).toThrow(ListContractError)
      expect(() => parseListEnvelope({ items: [], meta: { total: 10, page: 1.5, limit: 10, totalPages: 2 } })).toThrow(ListContractError)
      expect(() => parseListEnvelope({ items: [], meta: { total: NaN, page: 1, limit: 10, totalPages: 1 } })).toThrow(ListContractError)
      expect(() => parseListEnvelope({ items: [], meta: { total: 10, page: '1', limit: 10, totalPages: 1 } })).toThrow(ListContractError)
    })

    it('throws ListContractError when meta is corrupted (page > totalPages)', () => {
      const corruptedMeta = {
        items: [{ id: 'part-1' }],
        meta: { total: 10, page: 3, limit: 5, totalPages: 2 },
      }
      expect(() => parseListEnvelope(corruptedMeta)).toThrow(ListContractError)
      expect(() => parseListEnvelope(corruptedMeta)).toThrow('page (3) cannot exceed totalPages (2)')
    })

    it('throws ListContractError when totalPages is 0 but total > 0', () => {
      const corruptedZeroTotalPages = {
        items: [{ id: 'part-1' }],
        meta: { total: 10, page: 1, limit: 10, totalPages: 0 },
      }
      expect(() => parseListEnvelope(corruptedZeroTotalPages)).toThrow(ListContractError)
      expect(() => parseListEnvelope(corruptedZeroTotalPages)).toThrow('totalPages cannot be 0 when total (10) > 0')
    })

    it('accepts valid empty page 2+ response when totalPages is 0 and total is 0 (real backend contract)', () => {
      // Real backend parts.service.ts returns requested page with totalPages: 0 when result set is empty
      const emptyPageTwo = {
        items: [],
        meta: { total: 0, page: 2, limit: 10, totalPages: 0 },
      }
      const result = parseListEnvelope(emptyPageTwo)
      expect(result.items).toEqual([])
      expect(result.meta).toEqual({ total: 0, page: 2, limit: 10, totalPages: 0 })
      expect(result.hasNextPage).toBe(false)
    })

    it('throws ListContractError when totalPages is 0 and total is 0 but items is non-empty', () => {
      const corruptedItems = {
        items: [{ id: 'part-x' }],
        meta: { total: 0, page: 2, limit: 10, totalPages: 0 },
      }
      expect(() => parseListEnvelope(corruptedItems)).toThrow(ListContractError)
      expect(() => parseListEnvelope(corruptedItems)).toThrow('totalPages cannot be 0 when items is not empty')
    })
  })

  describe('hasNextPage calculation math', () => {
    it('computes hasNextPage = true when page < totalPages', () => {
      const page1 = parseListEnvelope({
        items: [{ id: '1' }],
        meta: { total: 30, page: 1, limit: 10, totalPages: 3 },
      })
      expect(page1.hasNextPage).toBe(true)

      const page2 = parseListEnvelope({
        items: [{ id: '2' }],
        meta: { total: 30, page: 2, limit: 10, totalPages: 3 },
      })
      expect(page2.hasNextPage).toBe(true)
    })

    it('computes hasNextPage = false when page === totalPages', () => {
      const page3 = parseListEnvelope({
        items: [{ id: '3' }],
        meta: { total: 30, page: 3, limit: 10, totalPages: 3 },
      })
      expect(page3.hasNextPage).toBe(false)
    })

    it('computes hasNextPage = false for single-page results and empty lists', () => {
      const singlePage = parseListEnvelope({
        items: [{ id: '1' }],
        meta: { total: 5, page: 1, limit: 10, totalPages: 1 },
      })
      expect(singlePage.hasNextPage).toBe(false)

      const emptyList = parseListEnvelope({
        items: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      })
      expect(emptyList.hasNextPage).toBe(false)
    })

    it('computes hasNextPage = false when meta is omitted (plain array or { items })', () => {
      expect(parseListEnvelope([{ id: '1' }]).hasNextPage).toBe(false)
      expect(parseListEnvelope({ items: [{ id: '1' }] }).hasNextPage).toBe(false)
    })
  })
})
