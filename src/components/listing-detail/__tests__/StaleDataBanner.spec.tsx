import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { StaleDataBanner } from '../StaleDataBanner'

describe('StaleDataBanner', () => {
  it('renders default stale message and calls onRetry when pressed', async () => {
    const onRetry = jest.fn()
    await render(<StaleDataBanner onRetry={onRetry} />)

    expect(screen.getByTestId('stale-data-banner')).toBeTruthy()
    expect(
      screen.getByText('تعذر تحديث البيانات، قد تكون المعلومات المعروضة قديمة')
    ).toBeTruthy()

    const retryBtn = screen.getByRole('button')
    expect(retryBtn.props.accessibilityLabel).toBe('إعادة المحاولة')
    fireEvent.press(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders custom message if provided', async () => {
    const onRetry = jest.fn()
    const customMsg = 'بيانات محفوظة غير محدثة'
    await render(<StaleDataBanner onRetry={onRetry} message={customMsg} />)
    expect(screen.getByText(customMsg)).toBeTruthy()
  })

  it('shows activity indicator and disables button when isRefetching is true', async () => {
    const onRetry = jest.fn()
    await render(<StaleDataBanner onRetry={onRetry} isRefetching={true} />)

    expect(screen.queryByText('إعادة المحاولة')).toBeNull()

    const retryBtn = screen.getByTestId('stale-data-retry-button')
    fireEvent.press(retryBtn)
    expect(onRetry).not.toHaveBeenCalled()
  })
})
