import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native'
import { DetailStates } from '../DetailStates'

describe('DetailStates', () => {
  const onRetry = jest.fn()
  const onBack = jest.fn()

  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('renders loading state with detail skeleton and busy accessibility state', async () => {
    await render(<DetailStates kind="loading" onRetry={onRetry} onBack={onBack} />)
    const loadingState = screen.getByTestId('detail-state-loading')
    expect(loadingState).toBeTruthy()
    expect(loadingState.props.accessibilityLabel).toBe('جاري التحميل')
    expect(loadingState.props.accessibilityState).toEqual({ busy: true })
    expect(screen.getByTestId('detail-skeleton')).toBeTruthy()
    expect(screen.getByTestId('detail-skeleton-top-bar')).toBeTruthy()
  })

  it('renders notFound state with back action', async () => {
    await render(<DetailStates kind="notFound" onRetry={onRetry} onBack={onBack} />)
    expect(screen.getByTestId('detail-state-not-found')).toBeTruthy()
    expect(screen.getByText('الإعلان غير موجود')).toBeTruthy()

    const backBtn = screen.getByText('الرجوع للرئيسية')
    await fireEvent.press(backBtn)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('renders offline state and calls onRetry when retry pressed', async () => {
    await render(<DetailStates kind="offline" onRetry={onRetry} onBack={onBack} />)
    expect(screen.getByTestId('detail-state-offline')).toBeTruthy()
    expect(screen.getByText('لا يوجد اتصال بالإنترنت')).toBeTruthy()

    const retryBtn = screen.getByText('إعادة المحاولة')
    await fireEvent.press(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)

    const backBtn = screen.getByText('الرجوع')
    await fireEvent.press(backBtn)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('renders timeout state and calls onRetry when retry pressed', async () => {
    await render(<DetailStates kind="timeout" onRetry={onRetry} onBack={onBack} />)
    expect(screen.getByTestId('detail-state-timeout')).toBeTruthy()
    expect(screen.getByText('انتهت مهلة الاتصال')).toBeTruthy()

    const retryBtn = screen.getByText('إعادة المحاولة')
    await fireEvent.press(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)

    const backBtn = screen.getByText('الرجوع')
    await fireEvent.press(backBtn)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('renders serverError state and calls onRetry when retry pressed', async () => {
    await render(<DetailStates kind="serverError" onRetry={onRetry} onBack={onBack} />)
    expect(screen.getByTestId('detail-state-server-error')).toBeTruthy()
    expect(screen.getByText('خطأ في الخادم')).toBeTruthy()

    const retryBtn = screen.getByText('إعادة المحاولة')
    await fireEvent.press(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)

    const backBtn = screen.getByText('الرجوع')
    await fireEvent.press(backBtn)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('renders fallback error state and calls onRetry when retry pressed', async () => {
    await render(<DetailStates kind="error" onRetry={onRetry} onBack={onBack} />)
    expect(screen.getByTestId('detail-state-error')).toBeTruthy()
    expect(screen.getByText('تعذر تحميل الإعلان')).toBeTruthy()

    const retryBtn = screen.getByText('إعادة المحاولة')
    await fireEvent.press(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)

    const backBtn = screen.getByText('الرجوع')
    await fireEvent.press(backBtn)
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
