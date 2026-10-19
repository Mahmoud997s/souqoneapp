import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { DeletionScheduledBanner } from '../components/profile/DeletionScheduledBanner'
import { useAuthStore } from '../store/authStore'
import { useAccountDeletion } from '../hooks/useAccountDeletion'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('../hooks/useAccountDeletion')

describe('DeletionScheduledBanner component', () => {
  const mockHandleCancelDeletion = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders null when account is not scheduled for deletion', async () => {
    ;(useAccountDeletion as jest.Mock).mockReturnValue({
      isScheduled: false,
      deletionScheduledAt: null,
      cancelling: false,
      handleCancelDeletion: mockHandleCancelDeletion,
    })

    const { queryByTestId } = await render(<DeletionScheduledBanner />)
    expect(queryByTestId('deletion-scheduled-banner')).toBeNull()
  })

  it('renders banner with title, formatted Oman date, and cancel button when scheduled', async () => {
    ;(useAccountDeletion as jest.Mock).mockReturnValue({
      isScheduled: true,
      deletionScheduledAt: '2026-10-25T11:15:00.000Z',
      cancelling: false,
      handleCancelDeletion: mockHandleCancelDeletion,
    })

    await render(<DeletionScheduledBanner />)

    expect(screen.getByTestId('deletion-scheduled-banner')).toBeTruthy()
    expect(screen.getByText('حسابك مجدول للحذف')).toBeTruthy()
    expect(
      screen.getByText(/سيتم حذف حسابك يوم الأحد 25 أكتوبر 2026 الساعة 3:15 م بتوقيت عُمان/)
    ).toBeTruthy()
    expect(screen.getByText('إلغاء طلب الحذف')).toBeTruthy()
  })

  it('triggers handleCancelDeletion when cancel button is clicked', async () => {
    ;(useAccountDeletion as jest.Mock).mockReturnValue({
      isScheduled: true,
      deletionScheduledAt: '2026-10-25T11:15:00.000Z',
      cancelling: false,
      handleCancelDeletion: mockHandleCancelDeletion,
    })

    await render(<DeletionScheduledBanner />)
    const btn = screen.getByTestId('deletion-banner-cancel-btn')
    fireEvent.press(btn)

    expect(mockHandleCancelDeletion).toHaveBeenCalledTimes(1)
  })
})
