import { getListErrorProps } from './getListErrorProps'
import { Colors } from '../constants/colors'
import axios from 'axios'

describe('getListErrorProps', () => {
  it('maps offline error correctly', () => {
    const error = new axios.AxiosError('Network Error', 'ERR_NETWORK')
    const props = getListErrorProps(error)
    expect(props.kind).toBe('offline')
    expect(props.title).toBe('لا يوجد اتصال بالإنترنت')
    expect(props.icon).toBe('cloud-offline-outline')
    expect(props.iconColor).toBe(Colors.warning)
    expect(props.actionLabel).toBe('إعادة المحاولة')
  })

  it('maps timeout error correctly', () => {
    const error = new axios.AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED')
    const props = getListErrorProps(error)
    expect(props.kind).toBe('timeout')
    expect(props.title).toBe('انتهت مهلة الاتصال')
    expect(props.icon).toBe('time-outline')
    expect(props.iconColor).toBe(Colors.warning)
    expect(props.actionLabel).toBe('إعادة المحاولة')
  })

  it('maps 500 server error correctly', () => {
    const error = new axios.AxiosError(
      'Request failed with status code 500',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        status: 500,
        statusText: 'Internal Server Error',
        data: {},
        headers: {},
        config: {} as any,
      }
    )
    const props = getListErrorProps(error)
    expect(props.kind).toBe('serverError')
    expect(props.title).toBe('خطأ في الخادم')
    expect(props.icon).toBe('server-outline')
    expect(props.iconColor).toBe(Colors.error)
    expect(props.actionLabel).toBe('إعادة المحاولة')
  })

  it('maps unknown error with custom fallback title', () => {
    const error = new Error('Generic failure')
    const props = getListErrorProps(error, 'تعذر تحميل المفضلة')
    expect(props.kind).toBe('unknown')
    expect(props.title).toBe('تعذر تحميل المفضلة')
    expect(props.icon).toBe('alert-circle-outline')
    expect(props.iconColor).toBe(Colors.error)
    expect(props.actionLabel).toBe('إعادة المحاولة')
  })
})
