import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { OperatorPendingDeletionBanner } from './OperatorPendingDeletionBanner'
import type { OperatorPendingDeletionView } from '../../../types/operatorDetailViewModel.types'

describe('OperatorPendingDeletionBanner', () => {
  const samplePending: OperatorPendingDeletionView = {
    id: 'req-1',
    requestedAt: '2026-10-22T10:00:00Z',
    requestedAtLabel: 'منذ ساعتين',
    status: 'PENDING',
  }

  it('renders banner headline, requested date and cancel button', async () => {
    const onCancel = jest.fn()
    await render(
      <OperatorPendingDeletionBanner
        pendingDeletion={samplePending}
        onCancel={onCancel}
        busy={false}
      />
    )

    expect(screen.getByTestId('operator-pending-deletion-banner')).toBeTruthy()
    expect(screen.getByText('طلب حذف قيد المراجعة')).toBeTruthy()
    expect(screen.getByText('تم تقديم الطلب منذ ساعتين')).toBeTruthy()

    const btn = screen.getByTestId('operator-cancel-deletion-button')
    fireEvent.press(btn)
    expect(onCancel).toHaveBeenCalled()
  })

  it('disables cancel button and shows indicator when busy', async () => {
    const onCancel = jest.fn()
    await render(
      <OperatorPendingDeletionBanner
        pendingDeletion={samplePending}
        onCancel={onCancel}
        busy={true}
      />
    )

    const btn = screen.getByTestId('operator-cancel-deletion-button')
    fireEvent.press(btn)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('returns null when pendingDeletion is null or undefined', async () => {
    await render(
      <OperatorPendingDeletionBanner pendingDeletion={null} />
    )

    expect(screen.queryByTestId('operator-pending-deletion-banner')).toBeNull()
  })
})
