import React from 'react'
import { act, fireEvent, render, renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OwnerManageBar } from '../OwnerManageBar'
import { OperatorPendingDeletionBanner } from '../../operators/detail/OperatorPendingDeletionBanner'
import { buildCarOwnerActions } from '../../../utils/listing-detail/ownerActionMatrix'
import { useBusOwnerActions } from '../../../hooks/listing-detail/useBusOwnerActions'
import { useOperatorOwnerActions } from '../../../hooks/listing-detail/useOperatorOwnerActions'
import { busesApi } from '../../../api/buses'
import { equipmentApi } from '../../../api/equipment'
import { useAuthStore } from '../../../store/authStore'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('expo-blur', () => {
  const { View } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) => <View testID="mock-blur" {...props} />,
  }
})

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) => <View testID="mock-icon" {...props} />,
  }
})

jest.mock('../../../api/buses', () => ({
  busesApi: { remove: jest.fn(), update: jest.fn() },
}))

jest.mock('../../../api/equipment', () => ({
  equipmentApi: { deleteOperator: jest.fn(), cancelOperatorDeletionRequest: jest.fn() },
}))

describe('D-346 per-button busyAction pattern', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('OwnerManageBar sticky variant', () => {
    it('shows spinner ONLY on delete when busyAction="delete", disables others without spinner', async () => {
      const onAction = jest.fn()
      const actions = buildCarOwnerActions('ACTIVE', 'SALE')

      const screen = await render(
        <OwnerManageBar
          variant="sticky"
          viewCount={10}
          busyAction="delete"
          actions={actions}
          onAction={onAction}
        />
      )

      expect(screen.getByTestId('btn-owner-delete-spinner')).toBeTruthy()
      expect(screen.queryByTestId('btn-owner-edit-spinner')).toBeNull()
      expect(screen.queryByTestId('btn-owner-manage-status-spinner')).toBeNull()

      fireEvent.press(screen.getByTestId('btn-owner-edit'))
      fireEvent.press(screen.getByTestId('btn-owner-manage-status'))
      fireEvent.press(screen.getByTestId('btn-owner-delete'))
      expect(onAction).not.toHaveBeenCalled()
    })

    it('shows spinner ONLY on manage-status when busyAction="markSold"', async () => {
      const onAction = jest.fn()
      const actions = buildCarOwnerActions('ACTIVE', 'SALE')

      const screen = await render(
        <OwnerManageBar
          variant="sticky"
          viewCount={10}
          busyAction="markSold"
          actions={actions}
          onAction={onAction}
        />
      )

      expect(screen.getByTestId('btn-owner-manage-status-spinner')).toBeTruthy()
      expect(screen.queryByTestId('btn-owner-edit-spinner')).toBeNull()
      expect(screen.queryByTestId('btn-owner-delete-spinner')).toBeNull()
    })
  })

  describe('OwnerManageBar inline variant', () => {
    it('shows spinner ONLY on pressed button when busyAction="archive"', async () => {
      const onAction = jest.fn()
      const actions = buildCarOwnerActions('ACTIVE', 'SALE')

      const screen = await render(
        <OwnerManageBar
          variant="inline"
          viewCount={10}
          busyAction="archive"
          actions={actions}
          onAction={onAction}
        />
      )

      expect(screen.getByTestId('btn-owner-archive-spinner')).toBeTruthy()
      expect(screen.queryByTestId('btn-owner-edit-spinner')).toBeNull()
      expect(screen.queryByTestId('btn-owner-delete-spinner')).toBeNull()
      expect(screen.queryByTestId('btn-owner-markSold-spinner')).toBeNull()
    })
  })

  describe('OperatorPendingDeletionBanner', () => {
    const pending = {
      id: 'req-1',
      requestedAt: '2026-10-22T10:00:00Z',
      requestedAtLabel: 'منذ ساعتين',
      status: 'PENDING' as const,
    }

    it('shows spinner and blocks double-tap when busyAction="cancelDeletion"', async () => {
      const onCancel = jest.fn()
      const screen = await render(
        <OperatorPendingDeletionBanner
          pendingDeletion={pending}
          onCancel={onCancel}
          busyAction="cancelDeletion"
        />
      )

      expect(screen.getByTestId('operator-cancel-deletion-spinner')).toBeTruthy()
      fireEvent.press(screen.getByTestId('operator-cancel-deletion-button'))
      expect(onCancel).not.toHaveBeenCalled()
    })
  })

  describe('Hooks: double-tap guard and finally reset', () => {
    function createWrapper() {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      )
    }

    it('useBusOwnerActions blocks concurrent double-tap and resets busyAction in finally on rejection', async () => {
      let rejectDelete!: (err: Error) => void
      ;(busesApi.remove as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((_, rej) => {
            rejectDelete = rej
          })
      )

      const vm = {
        id: 'bus-1',
        status: 'ACTIVE',
        busListingType: 'BUS_SALE',
        version: 1,
        viewCount: 5,
      } as unknown as Parameters<typeof useBusOwnerActions>[0]

      const { result } = await renderHook(() => useBusOwnerActions(vm), {
        wrapper: createWrapper(),
      })

      let firstPromise!: Promise<void>
      await act(async () => {
        firstPromise = result.current.run('delete')
        void result.current.run('delete')
      })

      expect(busesApi.remove).toHaveBeenCalledTimes(1)
      expect(result.current.busyAction).toBe('delete')

      await act(async () => {
        rejectDelete(new Error('network fail'))
        await expect(firstPromise).rejects.toThrow('network fail')
      })

      expect(result.current.busyAction).toBeNull()
      expect(result.current.busy).toBe(false)
    })

    it('useOperatorOwnerActions sets busyAction="restore" during cancel and resets in finally', async () => {
      useAuthStore.setState({ user: { id: 'owner-1', phone: '+96891234567' } as never })
      let resolveCancel!: () => void
      ;(equipmentApi.cancelOperatorDeletionRequest as jest.Mock).mockImplementationOnce(
        () =>
          new Promise<void>((res) => {
            resolveCancel = res
          })
      )

      const vm = {
        id: 'op-1',
        seller: { id: 'owner-1' },
        pendingDeletion: { id: 'req-9' },
        viewCount: 3,
      } as unknown as Parameters<typeof useOperatorOwnerActions>[0]

      const rendered = await renderHook(() => useOperatorOwnerActions(vm), {
        wrapper: createWrapper(),
      })

      let promise!: Promise<void>
      await act(async () => {
        promise = rendered.result.current.run('restore')
        void rendered.result.current.run('restore')
      })

      expect(equipmentApi.cancelOperatorDeletionRequest).toHaveBeenCalledTimes(1)
      expect(rendered.result.current.busyAction).toBe('restore')

      await act(async () => {
        resolveCancel()
        await promise
      })

      expect(rendered.result.current.busyAction).toBeNull()
    })
  })
})
