import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { OperatorReviewsCard } from './OperatorReviewsCard'

describe('OperatorReviewsCard', () => {
  it('renders rating and count when reviews exist', async () => {
    await render(
      <OperatorReviewsCard
        averageRating={4.8}
        totalReviews={12}
        canWrite={true}
        onPressViewAll={jest.fn()}
        onPressWrite={jest.fn()}
      />
    )

    expect(screen.getByTestId('operator-reviews-card')).toBeTruthy()
    expect(screen.getByTestId('operator-reviews-rating-row')).toBeTruthy()
    expect(screen.getByText('4.8')).toBeTruthy()
    expect(screen.getByText('(12)')).toBeTruthy()
    expect(screen.getByTestId('operator-reviews-view-all')).toBeTruthy()
    expect(screen.getByTestId('operator-reviews-write')).toBeTruthy()
    const starsRow = screen.getByTestId('operator-stars-row')
    expect(starsRow.props.accessible).toBe(true)
    expect(starsRow.props.accessibilityLabel).toBe('التقييم 4.8 من 5 بناءً على 12 تقييم')
  })

  it('renders empty state when totalReviews is 0 without fake rating', async () => {
    await render(
      <OperatorReviewsCard
        averageRating={0}
        totalReviews={0}
      />
    )

    expect(screen.getByTestId('operator-reviews-empty')).toBeTruthy()
    expect(screen.queryByTestId('operator-reviews-rating-row')).toBeNull()
    expect(screen.getByText('لا توجد تقييمات بعد')).toBeTruthy()
  })

  it('renders loading state when isLoading is true', async () => {
    await render(<OperatorReviewsCard isLoading={true} />)

    expect(screen.getByTestId('operator-reviews-loading')).toBeTruthy()
  })

  it('renders error state and handles onRetry press', async () => {
    const onRetry = jest.fn()
    await render(
      <OperatorReviewsCard isError={true} onRetry={onRetry} />
    )

    expect(screen.getByTestId('operator-reviews-error')).toBeTruthy()
    expect(screen.getByText('تعذر تحميل التقييمات حالياً')).toBeTruthy()

    const retryBtn = screen.getByTestId('operator-reviews-retry')
    fireEvent.press(retryBtn)
    expect(onRetry).toHaveBeenCalled()
  })

  it('hides write button when canWrite is false', async () => {
    await render(
      <OperatorReviewsCard
        averageRating={4.5}
        totalReviews={5}
        canWrite={false}
        onPressWrite={jest.fn()}
      />
    )

    expect(screen.queryByTestId('operator-reviews-write')).toBeNull()
  })
})
