import { buildCreateReviewPayload, reviewsApi } from '../api/reviews'
import { apiClient } from '../api/client'

jest.mock('../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

describe('D-248 / M5: Review payload target derivation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('buildCreateReviewPayload teeth assertions', () => {
    it('strictly omits revieweeId when entityType is OPERATOR_LISTING, even if revieweeId was passed', () => {
      const input = {
        entityId: 'op-456',
        entityType: 'OPERATOR_LISTING',
        rating: 5,
        comment: 'مشغل ممتاز وملتزم',
        revieweeId: 'user-operator-owner-789',
      }

      const payload = buildCreateReviewPayload(input)

      // Strict property existence assertion: 'revieweeId' key must NOT exist on the payload object
      expect('revieweeId' in payload).toBe(false)
      expect(Object.prototype.hasOwnProperty.call(payload, 'revieweeId')).toBe(false)
      expect(payload).not.toHaveProperty('revieweeId')

      // Exactly matches expected fields
      expect(payload).toEqual({
        entityId: 'op-456',
        entityType: 'OPERATOR_LISTING',
        rating: 5,
        comment: 'مشغل ممتاز وملتزم',
      })
    })

    it('strictly omits revieweeId when entityType is OPERATOR_LISTING and revieweeId is omitted', () => {
      const input = {
        entityId: 'op-101',
        entityType: 'OPERATOR_LISTING',
        rating: 4,
      }

      const payload = buildCreateReviewPayload(input)

      expect('revieweeId' in payload).toBe(false)
      expect(payload).toEqual({
        entityId: 'op-101',
        entityType: 'OPERATOR_LISTING',
        rating: 4,
      })
    })

    it('preserves revieweeId when entityType is LISTING (cars/general listing)', () => {
      const input = {
        entityId: 'car-202',
        entityType: 'LISTING',
        rating: 5,
        comment: 'سيارة بحالة الوكالة',
        revieweeId: 'seller-user-303',
      }

      const payload = buildCreateReviewPayload(input)

      expect('revieweeId' in payload).toBe(true)
      expect(payload.revieweeId).toBe('seller-user-303')
      expect(payload).toEqual({
        entityId: 'car-202',
        entityType: 'LISTING',
        rating: 5,
        comment: 'سيارة بحالة الوكالة',
        revieweeId: 'seller-user-303',
      })
    })

    it('preserves revieweeId for other vertical types (EQUIPMENT_LISTING, DRIVER_PROFILE, EMPLOYER_PROFILE)', () => {
      const types = ['EQUIPMENT_LISTING', 'DRIVER_PROFILE', 'EMPLOYER_PROFILE']

      for (const entityType of types) {
        const payload = buildCreateReviewPayload({
          entityId: 'entity-99',
          entityType,
          rating: 4,
          revieweeId: 'target-user-88',
        })

        expect('revieweeId' in payload).toBe(true)
        expect(payload.revieweeId).toBe('target-user-88')
      }
    })
  })

  describe('reviewsApi.create integration with apiClient.post', () => {
    it('dispatches POST /reviews without revieweeId property for OPERATOR_LISTING', async () => {
      ;(apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: 'rev-1' } })

      await reviewsApi.create({
        entityId: 'op-999',
        entityType: 'OPERATOR_LISTING',
        rating: 5,
        comment: 'خدمة احترافية',
        revieweeId: 'user-should-be-stripped',
      })

      expect(apiClient.post).toHaveBeenCalledTimes(1)
      const [endpoint, postedBody] = (apiClient.post as jest.Mock).mock.calls[0]
      expect(endpoint).toBe('/reviews')

      // Teeth: verify postedBody does NOT have revieweeId
      expect(postedBody).not.toHaveProperty('revieweeId')
      expect('revieweeId' in postedBody).toBe(false)
      expect(postedBody).toEqual({
        entityId: 'op-999',
        entityType: 'OPERATOR_LISTING',
        rating: 5,
        comment: 'خدمة احترافية',
      })
    })

    it('dispatches POST /reviews with revieweeId property for non-operator listings', async () => {
      ;(apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: 'rev-2' } })

      await reviewsApi.create({
        entityId: 'car-888',
        entityType: 'LISTING',
        rating: 4,
        comment: 'بائع متعاون',
        revieweeId: 'seller-user-777',
      })

      expect(apiClient.post).toHaveBeenCalledTimes(1)
      const [endpoint, postedBody] = (apiClient.post as jest.Mock).mock.calls[0]
      expect(endpoint).toBe('/reviews')
      expect(postedBody).toHaveProperty('revieweeId', 'seller-user-777')
    })
  })
})
