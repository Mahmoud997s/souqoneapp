import {
  getPublishRateLimitErrorMessage,
  formatCairoResetsTime,
} from '../publishRateLimitError'

describe('getPublishRateLimitErrorMessage (D-238)', () => {
  it('formats daily limit error with limit count and Cairo reset time', () => {
    const error = {
      response: {
        status: 429,
        data: {
          statusCode: 429,
          code: 'DAILY_LIMIT_EXCEEDED',
          window: 'day',
          vertical: 'parts',
          limit: 3,
          resetsAt: '2026-11-07T00:00:00.000Z',
        },
      },
    }

    const message = getPublishRateLimitErrorMessage(error)
    expect(message).toContain('لقد وصلت للحد اليومي لنشر الإعلانات (3 إعلانات في اليوم)')
    expect(message).toContain('يُعاد تعيين الحد في')
  })

  it('formats monthly limit error with limit count and Cairo reset time', () => {
    const error = {
      response: {
        status: 429,
        data: {
          statusCode: 429,
          code: 'MONTHLY_LIMIT_EXCEEDED',
          window: 'month',
          vertical: 'parts',
          limit: 20,
          resetsAt: '2026-12-01T00:00:00.000Z',
        },
      },
    }

    const message = getPublishRateLimitErrorMessage(error)
    expect(message).toContain('لقد وصلت للحد الشهري لنشر الإعلانات (20 إعلاناً في الشهر)')
    expect(message).toContain('يُعاد تعيين الحد في')
  })

  it('formats daily limit without resetsAt or limit count', () => {
    const error = {
      response: {
        data: {
          window: 'day',
        },
      },
    }

    const message = getPublishRateLimitErrorMessage(error)
    expect(message).toBe('لقد وصلت للحد اليومي لنشر الإعلانات.')
  })

  it('formats monthly limit without resetsAt or limit count', () => {
    const error = {
      response: {
        data: {
          window: 'month',
        },
      },
    }

    const message = getPublishRateLimitErrorMessage(error)
    expect(message).toBe('لقد وصلت للحد الشهري لنشر الإعلانات.')
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
