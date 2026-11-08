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
  normalizeImageUrl,
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

    it('rejects unknown ledger versions and returns safe fallback (A-053 P2)', () => {
      const v99Ledger = {
        version: 99,
        listingId: 'listing-99',
        uploadedImages: [],
      }
      const deserialized = deserializeLedger(JSON.stringify(v99Ledger))
      expect(deserialized.version).toBe(1)
      expect(deserialized.listingId).toBeUndefined()
    })

    it('sanitizes error messages and strips paths or queries (A-053 P2)', () => {
      const ledger: ReconciliationLedger = {
        ...createEmptyLedger('part-1'),
        failedOperations: {
          'upload:test': {
            key: 'upload:test',
            type: 'upload',
            error: 'Failed file:///data/user/0/com.app/cache/img.jpg with token https://api.com?secret=xyz',
            attempts: 1,
            lastAttemptAt: Date.now(),
          },
        },
      }
      const serialized = serializeLedger(ledger)
      const parsed = deserializeLedger(serialized)
      const op = parsed.failedOperations['upload:test']
      expect(op.error).not.toContain('/data/user/0')
      expect(op.error).not.toContain('secret=xyz')
    })

    it('enforces bounds on array items and attempts range (A-053 P2)', () => {
      const oversizedArray = Array.from({ length: 50 }, (_, i) => `img_${i}`)
      const ledger: ReconciliationLedger = {
        ...createEmptyLedger('part-1'),
        removedImageIds: oversizedArray,
      }
      const serialized = serializeLedger(ledger)
      const parsed = deserializeLedger(serialized)
      expect(parsed.removedImageIds.length).toBeLessThanOrEqual(20)
    })

    it('whitelists safe meta keys and strips unapproved raw properties (A-057 P2-b)', () => {
      const ledger: ReconciliationLedger = {
        ...createEmptyLedger('part-1'),
        failedOperations: {
          'upload:safe': {
            key: 'upload:safe',
            type: 'upload',
            error: 'Failed upload',
            attempts: 1,
            lastAttemptAt: Date.now(),
            meta: {
              localUri: 'file:///safe.jpg',
              remoteUrl: 'https://cdn.souqone.app/img.jpg?token=secret',
              unapprovedSecretToken: 'SUPER_SECRET_TOKEN',
              nestedObject: { key: 'value' },
            },
          },
        },
      }
      const serialized = serializeLedger(ledger)
      const parsed = deserializeLedger(serialized)
      const op = parsed.failedOperations['upload:safe']
      expect(op.meta?.localUri).toBe('file:///safe.jpg')
      expect(op.meta?.remoteUrl).toBe('https://cdn.souqone.app/img.jpg')
      expect((op.meta as any)?.unapprovedSecretToken).toBeUndefined()
      expect((op.meta as any)?.nestedObject).toBeUndefined()
    })

    it('deserializeLedger directly strips unapproved keys, tokens, and normalizes URLs from raw JSON on hydration (A-060 P2)', () => {
      const rawJson = JSON.stringify({
        version: 1,
        listingId: 'part-123',
        listingSaved: true,
        retainedImageIds: ['img-1'],
        removedImageIds: [],
        uploadedImages: [
          {
            localUri: 'file:///local.jpg',
            remoteUrl: 'https://cdn.souqone.app/upload.jpg?auth=token123',
            uploadedAt: 1000,
            isPrimary: true,
          },
        ],
        attachedUrls: [
          'https://cdn.souqone.app/upload.jpg?auth=token123',
          'https://cdn.souqone.app/upload2.jpg#frag',
        ],
        deletedImageIds: [],
        failedOperations: {
          'upload:bad': {
            key: 'upload:bad',
            type: 'upload',
            error: 'Some error',
            attempts: 1,
            lastAttemptAt: 1000,
            meta: {
              localUri: 'file:///local.jpg',
              remoteUrl: 'https://cdn.souqone.app/upload.jpg?auth=token123',
              injectedMaliciousPayload: { exploit: true },
              secretApiKey: 'sk_live_12345',
            },
          },
        },
      })
      const parsed = deserializeLedger(rawJson)
      expect(parsed.uploadedImages[0].remoteUrl).toBe('https://cdn.souqone.app/upload.jpg')
      expect(parsed.attachedUrls).toEqual([
        'https://cdn.souqone.app/upload.jpg',
        'https://cdn.souqone.app/upload2.jpg',
      ])
      const op = parsed.failedOperations['upload:bad']
      expect(op.meta?.remoteUrl).toBe('https://cdn.souqone.app/upload.jpg')
      expect((op.meta as any)?.injectedMaliciousPayload).toBeUndefined()
      expect((op.meta as any)?.secretApiKey).toBeUndefined()
    })

    it('returns empty ledger fallback if serialized size exceeds 50KB byte limit (A-057 P2-b)', () => {
      const oversizedString = 'A'.repeat(60000)
      const ledger: ReconciliationLedger = {
        ...createEmptyLedger('part-1'),
        retainedImageIds: [oversizedString],
      }
      const serialized = serializeLedger(ledger)
      expect(serialized.length).toBeLessThan(1000)
      const parsed = deserializeLedger(serialized)
      expect(parsed.version).toBe(1)
      expect(parsed.retainedImageIds).toEqual([])
    })
  })

  describe('normalizeImageUrl (A-057 P2-a)', () => {
    it('strips query parameters and hash fragments', () => {
      const input = 'https://cdn.souqone.com/uploads/photo1.jpg?token=abc123xyz&version=2#section'
      expect(normalizeImageUrl(input)).toBe('https://cdn.souqone.com/uploads/photo1.jpg')
    })

    it('strips trailing slashes', () => {
      const input = 'https://cdn.souqone.com/uploads/photo1.jpg/'
      expect(normalizeImageUrl(input)).toBe('https://cdn.souqone.com/uploads/photo1.jpg')
    })

    it('lowercases protocol and hostname while preserving path casing', () => {
      const input = 'HTTPS://CDN.SOUQONE.COM/Uploads/MyPartImage_ABC.jpg'
      expect(normalizeImageUrl(input)).toBe('https://cdn.souqone.com/Uploads/MyPartImage_ABC.jpg')
    })

    it('handles empty or non-string inputs safely', () => {
      expect(normalizeImageUrl('')).toBe('')
      expect(normalizeImageUrl(null as any)).toBe('')
      expect(normalizeImageUrl(undefined as any)).toBe('')
    })
  })

  describe('partsImageReconciliationAdapter', () => {
    it('declares vertical as parts and defines all adapter methods', () => {
      expect(partsImageReconciliationAdapter.vertical).toBe('parts')
      expect(typeof partsImageReconciliationAdapter.uploadImage).toBe('function')
      expect(typeof partsImageReconciliationAdapter.attachImageUrl).toBe('function')
      expect(typeof partsImageReconciliationAdapter.deleteImage).toBe('function')
      expect(typeof partsImageReconciliationAdapter.fetchAttachedUrls).toBe('function')
    })
  })
})
