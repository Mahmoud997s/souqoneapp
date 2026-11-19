import React from 'react'
import { act, render, screen } from '@testing-library/react-native'
import { AxiosError, AxiosHeaders } from 'axios'
import { GlobalToast } from '../components/ui/GlobalToast'
import { dialogService, mapDialogAlertToToast } from '../store/dialogStore'
import { useToastStore } from '../store/toastStore'
import { showErrorDialog } from '../utils/showErrorDialog'

jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => '/'),
}))

jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react')
  const { Text: RNText } = require('react-native')
  return {
    Ionicons: (props: { name: string; color?: string; size?: number }) =>
      ReactMock.createElement(
        RNText,
        {
          testID: 'mock-toast-ionicon',
          accessibilityLabel: `${props.name}|${props.color ?? ''}`,
        },
        props.name
      ),
  }
})

function makeAxiosError(
  code: string,
  status?: number,
  data?: unknown
): AxiosError {
  const headers = new AxiosHeaders()
  const config = { headers }
  const response =
    status !== undefined
      ? {
          status,
          statusText: 'Error',
          headers,
          config,
          data: data ?? {},
        }
      : undefined
  return new AxiosError('Request failed', code, config, undefined, response)
}

describe('F-03 D-366: dialogService Facade, GlobalToast & showErrorDialog', () => {
  beforeEach(() => {
    useToastStore.setState({
      current: null,
      queuedNotice: null,
      activeDecision: null,
      decisionQueue: [],
      activeSheet: null,
      modalHostIds: [],
    })
  })

  it('Case 1: showErrorDialog maps ERR_NETWORK and ECONNABORTED to error toast with cloud-offline-outline icon', async () => {
    const netErr = makeAxiosError('ERR_NETWORK')
    showErrorDialog(netErr, 'تعذر الاتصال بالخادم')

    const current = useToastStore.getState().current
    expect(current?.kind).toBe('error')
    expect(current?.icon).toBe('cloud-offline-outline')

    const { unmount } = await render(<GlobalToast />)
    expect(screen.getByTestId('mock-toast-ionicon').props.children).toBe('cloud-offline-outline')

    const timeoutErr = makeAxiosError('ECONNABORTED')
    await act(async () => {
      showErrorDialog(timeoutErr, 'انتهت مهلة الاتصال', 'خطأ في الاتصال')
    })

    expect(useToastStore.getState().current?.kind).toBe('error')
    expect(useToastStore.getState().current?.icon).toBe('cloud-offline-outline')
    expect(useToastStore.getState().current?.title).toBe('خطأ في الاتصال')
    await unmount()
  })

  it('Case 2: showErrorDialog maps HTTP 500, 400 and unknown errors to sticky error toast without generic title duplication', async () => {
    const serverErr = makeAxiosError('ERR_BAD_RESPONSE', 500, {
      message: 'Internal error',
    })
    showErrorDialog(serverErr, 'فشل العملية')

    expect(useToastStore.getState().current?.kind).toBe('error')
    expect(useToastStore.getState().current?.durationMs).toBeNull()

    const badReqErr = makeAxiosError('ERR_BAD_REQUEST', 400, {
      message: 'Validation failed',
    })
    showErrorDialog(badReqErr, 'فشل التحقق')
    expect(useToastStore.getState().current?.kind).toBe('error')
    expect(useToastStore.getState().current?.title).toBe(
      'بيانات الطلب غير صالحة. يرجى التأكد من البيانات والمحاولة مجدداً.'
    )

    showErrorDialog(new Error('Unexpected'), 'حدث خطأ غير متوقع')
    expect(useToastStore.getState().current?.kind).toBe('error')
  })

  it('Case 3: preserves default info and explicit success via facade without text inference', () => {
    dialogService.alert('تنبيه', 'يوجد خطأ في الاتصال بالإنترنت')
    expect(useToastStore.getState().current?.kind).toBe('info')
    expect(useToastStore.getState().current?.title).toBe('يوجد خطأ في الاتصال بالإنترنت')

    dialogService.alert('نجاح', 'تم تجاوز خطأ الاتصال بنجاح', 'success')
    expect(useToastStore.getState().current?.kind).toBe('success')
    expect(useToastStore.getState().current?.title).toBe('تم تجاوز خطأ الاتصال بنجاح')

    const mapped = mapDialogAlertToToast('خطأ', 'فشل الطلب', 'error')
    expect(mapped).toEqual({ kind: 'error', title: 'فشل الطلب' })
  })

  it('Case 4: destructive confirmation routes through DecisionToastCard with danger intent', async () => {
    const onConfirm = jest.fn()
    dialogService.confirm(
      'حذف الرسالة',
      'هل أنت متأكد من حذف هذه الرسالة؟',
      onConfirm,
      'حذف',
      'إلغاء',
      true
    )

    const decision = useToastStore.getState().activeDecision
    expect(decision?.intent).toBe('danger')
    expect(decision?.confirmLabel).toBe('حذف')
    expect(decision?.cancelLabel).toBe('إلغاء')

    const { unmount } = await render(<GlobalToast />)
    expect(screen.getByTestId('decision-toast-card')).toBeTruthy()
    await unmount()
  })
})
