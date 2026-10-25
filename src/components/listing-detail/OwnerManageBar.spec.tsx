import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { OwnerManageBar } from './OwnerManageBar'
import {
  buildCarOwnerActions,
  buildBusOwnerActions,
} from '../../utils/listing-detail/ownerActionMatrix'
import { dialogService } from '../../store/dialogStore'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('expo-blur', () => {
  const { View } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) => (
      <View testID="mock-blur" {...props} />
    ),
  }
})

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return {
    Ionicons: (props: Record<string, unknown>) => (
      <View testID="mock-icon" {...props} />
    ),
  }
})

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    showOptions: jest.fn(),
  },
}))

describe('OwnerManageBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('(a) sticky + actions [edit, markSold, archive, delete] shows edit, manage-status, delete and NOT archive/markSold directly', async () => {
    const onAction = jest.fn()
    const actions = buildCarOwnerActions('ACTIVE', 'SALE')

    await render(
      <OwnerManageBar
        variant="sticky"
        viewCount={12}
        busy={false}
        actions={actions}
        onAction={onAction}
      />
    )

    expect(screen.getByTestId('btn-owner-edit')).toBeTruthy()
    expect(screen.getByTestId('btn-owner-manage-status')).toBeTruthy()
    expect(screen.getByTestId('btn-owner-delete')).toBeTruthy()
    expect(screen.queryByTestId('btn-owner-archive')).toBeNull()
    expect(screen.queryByTestId('btn-owner-markSold')).toBeNull()
    expect(screen.getByText('تعديل')).toBeTruthy()
    expect(screen.getByText('إدارة الحالة')).toBeTruthy()
    expect(screen.getByText('حذف')).toBeTruthy()
  })

  it('(b) sticky + [edit, delete] (no status action, e.g. car RENTED) does not render the manage-status button', async () => {
    const onAction = jest.fn()
    const actions = buildCarOwnerActions('RENTED', 'RENTAL')

    await render(
      <OwnerManageBar
        variant="sticky"
        viewCount={5}
        busy={false}
        actions={actions}
        onAction={onAction}
      />
    )

    expect(screen.getByTestId('btn-owner-edit')).toBeTruthy()
    expect(screen.queryByTestId('btn-owner-manage-status')).toBeNull()
    expect(screen.getByTestId('btn-owner-delete')).toBeTruthy()
  })

  it('(c) sticky + [delete] (SOLD) only renders delete and does not render edit or manage-status', async () => {
    const onAction = jest.fn()
    const actions = buildCarOwnerActions('SOLD', 'SALE')

    await render(
      <OwnerManageBar
        variant="sticky"
        viewCount={5}
        busy={false}
        actions={actions}
        onAction={onAction}
      />
    )

    expect(screen.queryByTestId('btn-owner-edit')).toBeNull()
    expect(screen.queryByTestId('btn-owner-manage-status')).toBeNull()
    expect(screen.getByTestId('btn-owner-delete')).toBeTruthy()
  })

  it('(d) pressing manage-status calls dialogService.showOptions with options whose texts equal the status action labels in order (ACTIVE/SALE, ARCHIVED, RENTED, DRAFT, RENTAL, WANTED)', async () => {
    const onAction = jest.fn()

    const { rerender } = await render(
      <OwnerManageBar
        variant="sticky"
        viewCount={12}
        busy={false}
        actions={buildCarOwnerActions('ACTIVE', 'SALE')}
        onAction={onAction}
      />
    )

    await fireEvent.press(screen.getByTestId('btn-owner-manage-status'))
    expect(dialogService.showOptions).toHaveBeenLastCalledWith(
      'إدارة حالة الإعلان',
      expect.arrayContaining([
        expect.objectContaining({ text: 'تعليم كمباع' }),
        expect.objectContaining({ text: 'أرشفة' }),
      ])
    )
    const saleOptions = (dialogService.showOptions as jest.Mock).mock.calls[0][1]
    expect(saleOptions.map((o: { text: string }) => o.text)).toEqual([
      'تعليم كمباع',
      'أرشفة',
    ])

    await rerender(
      <OwnerManageBar
        variant="sticky"
        viewCount={12}
        busy={false}
        actions={buildCarOwnerActions('ARCHIVED', 'SALE')}
        onAction={onAction}
      />
    )
    await fireEvent.press(screen.getByTestId('btn-owner-manage-status'))
    const archivedOptions = (dialogService.showOptions as jest.Mock).mock.calls[1][1]
    expect(archivedOptions.map((o: { text: string }) => o.text)).toEqual([
      'استعادة',
    ])

    await rerender(
      <OwnerManageBar
        variant="sticky"
        viewCount={12}
        busy={false}
        actions={buildBusOwnerActions('RENTED', 'BUS_RENT')}
        onAction={onAction}
      />
    )
    await fireEvent.press(screen.getByTestId('btn-owner-manage-status'))
    const rentedOptions = (dialogService.showOptions as jest.Mock).mock.calls[2][1]
    expect(rentedOptions.map((o: { text: string }) => o.text)).toEqual([
      'إعادة إتاحة للإيجار',
    ])
  })

  it('(e) with jest fake timers, calling an option onPress and advancing 400 ms calls onAction once with the right id, and NOT before 400 ms', async () => {
    const onAction = jest.fn()
    const actions = buildCarOwnerActions('ACTIVE', 'SALE')

    await render(
      <OwnerManageBar
        variant="sticky"
        viewCount={12}
        busy={false}
        actions={actions}
        onAction={onAction}
      />
    )

    await fireEvent.press(screen.getByTestId('btn-owner-manage-status'))
    const [, options] = (dialogService.showOptions as jest.Mock).mock.calls[0]

    jest.useFakeTimers()
    options[1].onPress()
    jest.advanceTimersByTime(399)
    expect(onAction).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledWith('archive')
    jest.useRealTimers()
  })

  it('(f) unmount before the 400 ms timer fires -> onAction never called', async () => {
    const onAction = jest.fn()
    const actions = buildCarOwnerActions('ACTIVE', 'SALE')

    const rendered = await render(
      <OwnerManageBar
        variant="sticky"
        viewCount={12}
        busy={false}
        actions={actions}
        onAction={onAction}
      />
    )

    await fireEvent.press(screen.getByTestId('btn-owner-manage-status'))
    const [, options] = (dialogService.showOptions as jest.Mock).mock.calls[0]

    jest.useFakeTimers()
    options[0].onPress()

    const unmountPromise = rendered.unmount()
    jest.advanceTimersByTime(0)
    await unmountPromise

    jest.advanceTimersByTime(400)
    expect(onAction).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('(g) inline variant renders ALL actions in order (operator case: edit, restore)', async () => {
    const onAction = jest.fn()

    await render(
      <OwnerManageBar
        variant="inline"
        viewCount={99}
        busy={false}
        actions={[
          {
            id: 'edit',
            label: 'تعديل',
            tone: 'neutral',
            icon: 'create-outline',
          },
          {
            id: 'restore',
            label: 'إلغاء طلب الحذف',
            tone: 'primary',
            icon: 'refresh-outline',
          },
        ]}
        onAction={onAction}
      />
    )

    expect(screen.getByTestId('btn-owner-edit')).toBeTruthy()
    expect(screen.getByTestId('btn-owner-restore')).toBeTruthy()
    expect(screen.queryByTestId('btn-owner-manage-status')).toBeNull()
    expect(screen.getByText('تعديل')).toBeTruthy()
    expect(screen.getByText('إلغاء طلب الحذف')).toBeTruthy()
  })
})
