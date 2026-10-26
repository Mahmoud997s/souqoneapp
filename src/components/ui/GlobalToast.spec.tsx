import React from 'react'
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react-native'
import { GlobalToast } from './GlobalToast'
import { useToastStore } from '../../store/toastStore'

describe('GlobalToast', () => {
  beforeEach(() => {
    useToastStore.setState({ current: null })
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders nothing when there is no active toast', async () => {
    await render(<GlobalToast />)
    expect(screen.queryByTestId('global-toast-container')).toBeNull()
  })

  it('renders toast with title and message when provided', async () => {
    useToastStore.setState({
      current: {
        id: '1',
        kind: 'success',
        title: 'تمت إضافة الإعلان إلى المفضلة',
        message: 'حافلة مرسيدس 2024',
        durationMs: 60000,
      },
    })

    await render(<GlobalToast />)
    await waitFor(() => {
      expect(screen.getByTestId('global-toast-container')).toBeTruthy()
      expect(screen.getByText('تمت إضافة الإعلان إلى المفضلة')).toBeTruthy()
      expect(screen.getByText('حافلة مرسيدس 2024')).toBeTruthy()
    })
  })

  it('renders only title without empty message line when message is absent', async () => {
    useToastStore.setState({
      current: {
        id: '2',
        kind: 'neutral',
        title: 'تمت إزالة الإعلان من المفضلة',
        durationMs: 60000,
      },
    })

    await render(<GlobalToast />)
    await waitFor(() => {
      expect(screen.getByText('تمت إزالة الإعلان من المفضلة')).toBeTruthy()
      expect(screen.queryByText('undefined')).toBeNull()
    })
  })

  it('dismisses toast on card press', async () => {
    useToastStore.setState({
      current: {
        id: '3',
        kind: 'error',
        title: 'إشعار',
        durationMs: 60000,
      },
    })

    await render(<GlobalToast />)
    const card = await screen.findByTestId('global-toast-card')
    fireEvent.press(card)
    await waitFor(() => {
      expect(useToastStore.getState().current).toBeNull()
    })
  })

  it('auto-dismisses toast after durationMs', async () => {
    useToastStore.setState({
      current: {
        id: 'timer-1',
        kind: 'success',
        title: 'تمت إضافة الإعلان إلى المفضلة',
        durationMs: 300,
      },
    })
    await render(<GlobalToast />)
    await waitFor(() => {
      expect(screen.getByTestId('global-toast-container')).toBeTruthy()
    })

    await waitFor(
      () => {
        expect(useToastStore.getState().current).toBeNull()
      },
      { timeout: 1500 }
    )
  })
})
