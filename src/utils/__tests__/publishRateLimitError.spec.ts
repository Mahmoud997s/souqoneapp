import {
  getPublishRateLimitErrorMessage,
  formatCairoResetsTime,
} from '../publishRateLimitError'

describe('getPublishRateLimitErrorMessage (D-238 & D-242)', () => {
  it('formats real backend filter response (status + message + PUBLISH_RATE_LIMIT_DAILY_REACHED) without resetsAt', () => {
    // Real backend HTTP exception filter strips limit/currentCount/resetsAt
    const error = {
      response: {
        status: 429,
        data: {
          statusCode: 429,
          message: 'تم تجاوز الحد اليومي لنشر الإعلانات',
          code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED',
          timestamp: '2026-11-08T12:00:00.000Z',
        },
      },
    }

    const message = getPublishRateLimitErrorMessage(error)
    expect(message).toBe('وصلت للحد اليومي للنشر، جرّب غداً.')
  })

  it('formats real backend filter response (status + message + PUBLISH_RATE_LIMIT_MONTHLY_REACHED) without resetsAt', () => {
    const error = {
      response: {
        status: 429,
        data: {
          statusCode: 429,
          message: 'تم تجاوز الحد الشهري لنشر الإعلانات',
          code: 'PUBLISH_RATE_LIMIT_MONTHLY_REACHED',
          timestamp: '2026-11-08T12:00:00.000Z',
        },
      },
    }

    const message = getPublishRateLimitErrorMessage(error)
    expect(message).toBe('وصلت للحد الشهري للنشر، جرّب الشهر القادم.')
  })

  it('formats daily limit error with limit count and Cairo reset time if provided', () => {
    const error = {
      response: {
        status: 429,
        data: {
          statusCode: 429,
          code: 'PUBLISH_RATE_LIMIT_DAILY_REACHED',
          window: 'DAILY',
          vertical: 'parts',
          limit: 3,
          resetsAt: '2026-11-07T00:00:00.000Z',
        },
      },
    }

    const message = getPublishRateLimitErrorMessage(error)
    expect(message).toContain('وصلت للحد اليومي لنشر الإعلانات (3 إعلانات في اليوم)')
    expect(message).toContain('يُعاد تعيين الحد في')
  })

  it('formats monthly limit error with limit count and Cairo reset time if provided', () => {
    const error = {
      response: {
        status: 429,
        data: {
          statusCode: 429,
          code: 'PUBLISH_RATE_LIMIT_MONTHLY_REACHED',
          window: 'MONTHLY',
          vertical: 'parts',
          limit: 20,
          resetsAt: '2026-12-01T00:00:00.000Z',
        },
      },
    }

    const message = getPublishRateLimitErrorMessage(error)
    expect(message).toContain('وصلت للحد الشهري لنشر الإعلانات (20 إعلاناً في الشهر)')
    expect(message).toContain('يُعاد تعيين الحد في')
  })

  it('formats daily limit with uppercase DAILY or lowercase day window without resetsAt', () => {
    const errorUpper = {
      response: {
        data: {
          window: 'DAILY',
        },
      },
    }
    expect(getPublishRateLimitErrorMessage(errorUpper)).toBe('وصلت للحد اليومي للنشر، جرّب غداً.')

    const errorLower = {
      response: {
        data: {
          window: 'day',
        },
      },
    }
    expect(getPublishRateLimitErrorMessage(errorLower)).toBe('وصلت للحد اليومي للنشر، جرّب غداً.')
  })

  it('formats monthly limit with uppercase MONTHLY or lowercase month window without resetsAt', () => {
    const errorUpper = {
      response: {
        data: {
          window: 'MONTHLY',
        },
      },
    }
    expect(getPublishRateLimitErrorMessage(errorUpper)).toBe('وصلت للحد الشهري للنشر، جرّب الشهر القادم.')

    const errorLower = {
      response: {
        data: {
          window: 'month',
        },
      },
    }
    expect(getPublishRateLimitErrorMessage(errorLower)).toBe('وصلت للحد الشهري للنشر، جرّب الشهر القادم.')
  })

  it('falls back to default Arabic message when body is unstructured or empty (legacy throttler)', () => {
    const errorWithNoData = {
      response: {
        status: 429,
      },
    }
    expect(getPublishRateLimitErrorMessage(errorWithNoData)).toBe(
      'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.'
    )

    const rawError = new Error('Too many requests')
    expect(getPublishRateLimitErrorMessage(rawError)).toBe(
      'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.'
    )

    expect(getPublishRateLimitErrorMessage(null)).toBe(
      'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة واحدة ثم المحاولة مجدداً.'
    )
  })

  it('formatCairoResetsTime handles invalid date strings gracefully', () => {
    expect(formatCairoResetsTime('invalid-date')).toBe('invalid-date')
  })
})
