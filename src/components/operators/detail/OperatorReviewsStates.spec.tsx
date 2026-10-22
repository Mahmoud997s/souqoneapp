import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { OperatorReviewsStates } from './OperatorReviewsStates'

describe('OperatorReviewsStates', () => {
  it('renders loading state properly', async () => {
    await render(<OperatorReviewsStates isLoading={true} />)
    expect(screen.getByTestId('operator-reviews-loading')).toBeTruthy()
    expect(screen.getByText('جاري تحميل التقييمات...')).toBeTruthy()
  })

  it('renders error state properly and calls onRetry when pressed', async () => {
    const onRetryMock = jest.fn()
    await render(<OperatorReviewsStates isError={true} onRetry={onRetryMock} />)
    expect(screen.getByTestId('operator-reviews-error')).toBeTruthy()
    expect(screen.getByText('تعذر تحميل التقييمات حالياً')).toBeTruthy()

    fireEvent.press(screen.getByTestId('operator-reviews-retry'))
    expect(onRetryMock).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when not loading and not error', async () => {
    const { toJSON } = await render(<OperatorReviewsStates isLoading={false} isError={false} />)
    expect(toJSON()).toBeNull()
  })
})
