import React from 'react'
import { render, fireEvent, cleanup, act } from '@testing-library/react-native'
import { BackHandler } from 'react-native'
import { PublishSuccessView } from '../PublishSuccessView'

jest.mock('expo-linear-gradient', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    LinearGradient: ({ children, testID, style }: any) => (
      <View testID={testID} style={style}>
        {children}
      </View>
    ),
  }
})

describe('PublishSuccessView (D-238 / F07)', () => {
  const mockPrimary = jest.fn()
  const mockSecondary = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any)
  })

  it('renders default title and subtitle with primary action', async () => {
    const { getByTestId, getByText } = await render(
      <PublishSuccessView
        primaryAction={{
          label: 'عرض إعلانك',
          onPress: mockPrimary,
          testID: 'primary-action-btn',
        }}
      />
    )

    expect(getByTestId('publish-success-view')).toBeTruthy()
    expect(getByTestId('publish-success-icon')).toBeTruthy()
    expect(getByText('تم نشر إعلانك بنجاح!')).toBeTruthy()
    expect(
      getByText(
        'إعلانك متاح الآن للمشترين في سوق ون بسلطنة عُمان. يمكنك متابعة المشاهدات والرسائل من لوحة تحكمك.'
      )
    ).toBeTruthy()

    const primaryBtn = getByTestId('primary-action-btn')
    expect(primaryBtn).toBeTruthy()
    await act(async () => {
      fireEvent.press(primaryBtn)
    })
    expect(mockPrimary).toHaveBeenCalledTimes(1)
  })

  it('renders custom title, subtitle, and both primary and secondary actions', async () => {
    const { getByText, getByTestId } = await render(
      <PublishSuccessView
        title="تم حفظ التعديلات بنجاح!"
        subtitle="تم تحديث بيانات قطعة الغيار بنجاح في سوق ون."
        primaryAction={{
          label: 'عرض إعلاني الآن',
          onPress: mockPrimary,
          testID: 'btn-view',
        }}
        secondaryAction={{
          label: 'إضافة إعلان آخر',
          onPress: mockSecondary,
          testID: 'btn-another',
        }}
      />
    )

    expect(getByText('تم حفظ التعديلات بنجاح!')).toBeTruthy()
    expect(
      getByText('تم تحديث بيانات قطعة الغيار بنجاح في سوق ون.')
    ).toBeTruthy()

    const primaryBtn = getByTestId('btn-view')
    const secondaryBtn = getByTestId('btn-another')

    await act(async () => {
      fireEvent.press(primaryBtn)
    })
    expect(mockPrimary).toHaveBeenCalledTimes(1)

    await act(async () => {
      fireEvent.press(secondaryBtn)
    })
    expect(mockSecondary).toHaveBeenCalledTimes(1)
  })

  it('registers Android hardwareBackPress handler that triggers secondary action and consumes event', async () => {
    await render(
      <PublishSuccessView
        primaryAction={{
          label: 'عرض الإعلان',
          onPress: mockPrimary,
        }}
        secondaryAction={{
          label: 'إضافة آخر',
          onPress: mockSecondary,
        }}
      />
    )

    expect(BackHandler.addEventListener).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function)
    )

    const callback1 = (BackHandler.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === 'hardwareBackPress'
    )?.[1]

    expect(callback1).toBeDefined()
    let result = false
    await act(async () => {
      result = callback1()
    })
    expect(result).toBe(true)
    expect(mockSecondary).toHaveBeenCalledTimes(1)
    expect(mockPrimary).not.toHaveBeenCalled()
  })

  it('triggers custom onHardwareBack handler when provided', async () => {
    const customBack = jest.fn().mockReturnValue(true)
    await render(
      <PublishSuccessView
        primaryAction={{
          label: 'عرض الإعلان',
          onPress: mockPrimary,
        }}
        onHardwareBack={customBack}
      />
    )

    const callback = (BackHandler.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === 'hardwareBackPress'
    )?.[1]

    expect(callback).toBeDefined()
    let result = false
    await act(async () => {
      result = callback()
    })
    expect(result).toBe(true)
    expect(customBack).toHaveBeenCalledTimes(1)
    expect(mockPrimary).not.toHaveBeenCalled()
  })
})
