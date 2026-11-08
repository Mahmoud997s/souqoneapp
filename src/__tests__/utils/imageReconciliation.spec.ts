import {
  createEmptyLedger,
  dedupeIds,
  appendRemovedImageIds,
  normalizeLocalImage,
  normalizeExistingImage,
  serializeLedger,
  deserializeLedger,
  makeOpKey,
  partsImageReconciliationAdapter,
  ReconciliationLedger,
} from '../../utils/imageReconciliation'

describe('imageReconciliation utilities (S6 / D-243)', () => {
  describe('createEmptyLedger', () => {
    it('creates a fresh v1 ledger with empty collections', () => {
      const ledger = createEmptyLedger('listing_456')
      expect(ledger.version).toBe(1)
      expect(ledger.listingId).toBe('listing_456')
      expect(ledger.retainedImageIds).toEqual([])
      expect(ledger.removedImageIds).toEqual([])
      expect(ledger.uploadedImages).toEqual([])
      expect(ledger.attachedUrls).toEqual([])
      expect(ledger.deletedImageIds).toEqual([])
      expect(ledger.failedOperations).toEqual({})
      expect(ledger.listingSaved).toBe(false)
    })
  })

  describe('dedupeIds & appendRemovedImageIds', () => {
    it('deduplicates string IDs, trims whitespace, and preserves insertion order', () => {
      const raw = [' id1 ', 'id2', 'id1', '', '   ', 'id3', 'id2', 'id4 ']
      const result = dedupeIds(raw)
      expect(result).toEqual(['id1', 'id2', 'id3', 'id4'])
    })

    it('handles non-array or empty inputs safely', () => {
      expect(dedupeIds(null as any)).toEqual([])
      expect(dedupeIds(undefined as any)).toEqual([])
      expect(dedupeIds([])).toEqual([])
      expect(dedupeIds([123, null, undefined] as any)).toEqual([])
    })

    it('merges current and new removed image IDs with deduplication', () => {
      const current = ['img_1', 'img_2']
      const added = ['img_2', 'img_3', 'img_1', 'img_4']
      const merged = appendRemovedImageIds(current, added)
      expect(merged).toEqual(['img_1', 'img_2', 'img_3', 'img_4'])
    })
  })

  describe('normalizeLocalImage & normalizeExistingImage', () => {
    it('normalizes string URIs and object inputs', () => {
      expect(normalizeLocalImage('file:///photo.jpg')).toEqual({ uri: 'file:///photo.jpg' })
      expect(normalizeLocalImage({ uri: 'file:///photo.jpg', isPrimary: true })).toEqual({
        uri: 'file:///photo.jpg',
        isPrimary: true,
      })
      expect(normalizeLocalImage('')).toBeNull()
      expect(normalizeLocalImage(null as any)).toBeNull()
    })

    it('normalizes existing images', () => {
      expect(normalizeExistingImage('https://cdn.souqone.app/car.jpg')).toEqual({
        url: 'https://cdn.souqone.app/car.jpg',
      })
      expect(normalizeExistingImage({ id: 'img_9', url: 'https://cdn.souqone.app/car.jpg' })).toEqual({
        id: 'img_9',
        url: 'https://cdn.souqone.app/car.jpg',
      })
      expect(normalizeExistingImage('')).toBeNull()
      expect(normalizeExistingImage(null as any)).toBeNull()
    })
  })

  describe('makeOpKey', () => {
    it('generates consistent deterministic keys', () => {
      expect(makeOpKey.upload('file:///a.jpg')).toBe('upload:file:///a.jpg')
      expect(makeOpKey.attach('https://cdn/a.jpg')).toBe('attach:https://cdn/a.jpg')
      expect(makeOpKey.delete('img_001')).toBe('delete:img_001')
    })
  })

  describe('serializeLedger & deserializeLedger', () => {
    it('performs a clean round-trip preserving all properties', () => {
      const ledger: ReconciliationLedger = {
        version: 1,
        listingId: 'part_999',
        retainedImageIds: ['img_old_1'],
        removedImageIds: ['img_old_2', 'img_old_3'],
        uploadedImages: [
          {
            localUri: 'file:///tmp/1.jpg',
            remoteUrl: 'https://cdn/1.jpg',
            uploadedAt: 1700000000000,
            isPrimary: true,
          },
        ],
        attachedUrls: ['https://cdn/1.jpg'],
        deletedImageIds: ['img_old_2'],
        failedOperations: {
          'upload:file:///tmp/2.jpg': {
            key: 'upload:file:///tmp/2.jpg',
            type: 'upload',
            error: 'Network timeout',
            attempts: 2,
            lastAttemptAt: 1700000005000,
            meta: { localUri: 'file:///tmp/2.jpg' },
          },
        },
        listingSaved: true,
      }

      const serialized = serializeLedger(ledger)
      expect(typeof serialized).toBe('string')

      const deserialized = deserializeLedger(serialized)
      expect(deserialized).toEqual(ledger)
    })

    it('returns a safe fallback ledger when given invalid or corrupted input', () => {
      expect(deserializeLedger(null).version).toBe(1)
      expect(deserializeLedger('corrupted json {').version).toBe(1)
      expect(deserializeLedger({}).version).toBe(1)
      expect(deserializeLedger([]).version).toBe(1)
    })
  })

  describe('partsImageReconciliationAdapter', () => {
    it('declares vertical as parts and defines all adapter methods', () => {
      expect(partsImageReconciliationAdapter.vertical).toBe('parts')
      expect(typeof partsImageReconciliationAdapter.uploadImage).toBe('function')
      expect(typeof partsImageReconciliationAdapter.attachImageUrl).toBe('function')
      expect(typeof partsImageReconciliationAdapter.deleteImage).toBe('function')
    })
  })
})
