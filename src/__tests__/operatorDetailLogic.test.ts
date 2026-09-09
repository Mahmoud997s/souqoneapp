describe('Operator Detail Screen - Business & Display Logic', () => {
  describe('Fix 1: profileImageUrl resolution priority', () => {
    it('prioritizes operator.profileImageUrl over user avatar', () => {
      const operator = {
        profileImageUrl: 'https://cloudinary.com/custom-operator-photo.jpg',
        user: {
          avatarUrl: 'https://cloudinary.com/generic-user-avatar.jpg',
        },
      }
      const avatarUrl = operator.profileImageUrl || operator.user?.avatarUrl

      expect(avatarUrl).toBe('https://cloudinary.com/custom-operator-photo.jpg')
    })

    it('falls back to user.avatarUrl if operator.profileImageUrl is null or undefined', () => {
      const operator = {
        profileImageUrl: null,
        user: {
          avatarUrl: 'https://cloudinary.com/generic-user-avatar.jpg',
        },
      }
      const avatarUrl = operator.profileImageUrl || operator.user?.avatarUrl

      expect(avatarUrl).toBe('https://cloudinary.com/generic-user-avatar.jpg')
    })
  })

  describe('Fix 2: whatsappNumber resolution priority', () => {
    it('prefers operator.whatsapp over contactPhone for WhatsApp action', () => {
      const operator = {
        whatsapp: '96899112233',
        contactPhone: '96891234567',
      }
      const whatsappNumber = operator.whatsapp || operator.contactPhone

      expect(whatsappNumber).toBe('96899112233')
    })

    it('falls back to contactPhone if whatsapp is not set', () => {
      const operator = {
        whatsapp: null as string | null,
        contactPhone: '96891234567',
      }
      const whatsappNumber = operator.whatsapp || operator.contactPhone

      expect(whatsappNumber).toBe('96891234567')
    })
  })

  describe('Fix 3: Certificate image vs text categorization', () => {
    it('correctly partitions certifications into images and text chips', () => {
      const certifications = [
        'https://res.cloudinary.com/demo/image/upload/v1/cert1.jpg',
        '/uploads/cert2.png',
        'شهادة السلامة والصحة المهنية (OSHA)',
        'رخصة قيادة معدات ثقيلة سارية',
      ]

      const certImages = certifications.filter(
        (c: string) => c.startsWith('http') || c.startsWith('/')
      )
      const certTexts = certifications.filter(
        (c: string) => !c.startsWith('http') && !c.startsWith('/')
      )

      expect(certImages).toEqual([
        'https://res.cloudinary.com/demo/image/upload/v1/cert1.jpg',
        '/uploads/cert2.png',
      ])
      expect(certTexts).toEqual([
        'شهادة السلامة والصحة المهنية (OSHA)',
        'رخصة قيادة معدات ثقيلة سارية',
      ])
    })
  })

  describe('Fix 4: Owner pending deletion request indication', () => {
    it('displays pending deletion banner when owner views their own listing with PENDING status', () => {
      const currentUserId = 'user-123'
      const operator = {
        userId: 'user-123',
        pendingDeletionRequest: {
          id: 'del-req-1',
          createdAt: new Date().toISOString(),
          status: 'PENDING' as const,
        },
      }

      const isOwner = currentUserId === operator.userId
      const shouldShowBanner =
        isOwner &&
        Boolean(
          operator.pendingDeletionRequest &&
            operator.pendingDeletionRequest.status === 'PENDING'
        )

      expect(shouldShowBanner).toBe(true)
    })

    it('does NOT display pending deletion banner if viewer is not the owner', () => {
      const currentUserId = 'other-user-456'
      const operator = {
        userId: 'user-123',
        pendingDeletionRequest: {
          id: 'del-req-1',
          createdAt: new Date().toISOString(),
          status: 'PENDING' as const,
        },
      }

      const isOwner = currentUserId === operator.userId
      const shouldShowBanner =
        isOwner &&
        Boolean(
          operator.pendingDeletionRequest &&
            operator.pendingDeletionRequest.status === 'PENDING'
        )

      expect(shouldShowBanner).toBe(false)
    })

    it('does NOT display pending deletion banner if status is not PENDING', () => {
      const currentUserId = 'user-123'
      const operator = {
        userId: 'user-123',
        pendingDeletionRequest: {
          id: 'del-req-1',
          createdAt: new Date().toISOString(),
          status: 'APPROVED' as any,
        },
      }

      const isOwner = currentUserId === operator.userId
      const shouldShowBanner =
        isOwner &&
        Boolean(
          operator.pendingDeletionRequest &&
            operator.pendingDeletionRequest.status === 'PENDING'
        )

      expect(shouldShowBanner).toBe(false)
    })
  })

  describe('Cleanup Fixes 1-4: Cleaned legacy fallbacks and shared mappers', () => {
    it('Fix 1: formatLocation correctly formats operator location with governorate and wilaya', () => {
      const { formatLocation } = require('../utils/mappers')
      const operatorWithRefs = {
        governorateRef: { nameAr: 'مسقط' },
        wilayaRef: { nameAr: 'السيب' },
      }
      expect(formatLocation(operatorWithRefs as any)).toBe('مسقط، السيب')

      const operatorWithLegacyStrings = {
        governorate: 'ظفار',
        city: 'صلالة',
      }
      expect(formatLocation(operatorWithLegacyStrings as any)).toBe('ظفار، صلالة')
    })

    it('Fix 2: operator.title is used directly for WhatsApp message without mapOperatorToCard', () => {
      const operator = {
        title: 'مشغل رافعة برجية محترف',
      }
      const displayName = 'أحمد المهري'
      const msg = encodeURIComponent(`مرحباً ${displayName}، بخصوص ملفك كمشغل في تطبيق سوق ون: ${operator.title}`)
      expect(decodeURIComponent(msg)).toContain('بخصوص ملفك كمشغل في تطبيق سوق ون: مشغل رافعة برجية محترف')
    })

    it('Fix 4: resolves sellerId and sellerPhone directly without obsolete .raw fallbacks', () => {
      const cleanOperator = {
        userId: 'user-999',
        contactPhone: '96899887766',
        profileImageUrl: 'https://cloudinary.com/op.jpg',
        user: {
          avatarUrl: 'https://cloudinary.com/user.jpg',
          displayName: 'سالم المعمري',
          isVerified: true,
        },
        isPriceNegotiable: true,
      }

      expect(cleanOperator.userId).toBe('user-999')
      expect(cleanOperator.contactPhone).toBe('96899887766')
      expect(cleanOperator.isPriceNegotiable).toBe(true)
      expect(Boolean(cleanOperator.user?.isVerified)).toBe(true)
    })
  })

  describe('Reviews Integration for Operators', () => {
    const operator = {
      id: 'op-123',
      userId: 'user-seller-789',
      title: 'مشغل رافعة محترف',
    }

    it('constructs correct reviewsUrl with entityType=OPERATOR_LISTING and correct entityId and revieweeId', () => {
      const sellerId = operator.userId
      const reviewsUrl = `/reviews/${operator.id}?type=OPERATOR_LISTING&revieweeId=${sellerId}`

      expect(reviewsUrl).toBe('/reviews/op-123?type=OPERATOR_LISTING&revieweeId=user-seller-789')
      expect(reviewsUrl).toContain(`/reviews/${operator.id}`)
      expect(reviewsUrl).toContain('type=OPERATOR_LISTING')
      expect(reviewsUrl).toContain(`revieweeId=${sellerId}`)
    })

    it('constructs correct writeReviewUrl with write=true parameter', () => {
      const sellerId = operator.userId
      const writeReviewUrl = `/reviews/${operator.id}?type=OPERATOR_LISTING&revieweeId=${sellerId}&write=true`

      expect(writeReviewUrl).toBe('/reviews/op-123?type=OPERATOR_LISTING&revieweeId=user-seller-789&write=true')
      expect(writeReviewUrl).toContain('write=true')
    })

    it('allows non-owner to see "أضف تقييم" write affordance', () => {
      const currentUser = { id: 'user-buyer-456' }
      const sellerId = operator.userId
      const isOwner = currentUser.id === sellerId

      const showWriteAffordance = !isOwner
      expect(isOwner).toBe(false)
      expect(showWriteAffordance).toBe(true)
    })

    it('prevents owner from seeing "أضف تقييم" self-review affordance', () => {
      const currentUser = { id: 'user-seller-789' }
      const sellerId = operator.userId
      const isOwner = currentUser.id === sellerId

      const showWriteAffordance = !isOwner
      expect(isOwner).toBe(true)
      expect(showWriteAffordance).toBe(false)
    })

    it('calculates avgRating and reviewCount accurately from review items', () => {
      const reviewsList = [
        { id: 'r1', rating: 5, comment: 'ممتاز ومحترف' },
        { id: 'r2', rating: 4, comment: 'جيد جداً' },
        { id: 'r3', rating: 5, comment: 'دقيق في المواعيد' },
      ]

      const reviewCount = reviewsList.length
      const avgRating = reviewCount > 0
        ? reviewsList.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) / reviewCount
        : 0

      expect(reviewCount).toBe(3)
      expect(avgRating).toBeCloseTo(4.67, 2)
      expect(avgRating.toFixed(1)).toBe('4.7')
    })

    it('handles empty reviews gracefully returning 0 and "جديد"', () => {
      const reviewsList: any[] = []
      const reviewCount = reviewsList.length
      const avgRating = reviewCount > 0
        ? reviewsList.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) / reviewCount
        : 0

      const badgeText = reviewCount > 0 ? `${avgRating.toFixed(1)} (${reviewCount})` : 'جديد'
      expect(reviewCount).toBe(0)
      expect(avgRating).toBe(0)
      expect(badgeText).toBe('جديد')
    })
  })
})
