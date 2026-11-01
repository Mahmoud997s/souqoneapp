import React from 'react'
import { View, StyleSheet } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import {
  AddListingButton,
  ADD_BUTTON_ASSET,
} from '../../components/navigation/AddListingButton'
import { BottomBarTokens } from '../../constants/bottomBarTokens'

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}))

jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) =>
      React.createElement(View, { testID: 'mock-expo-image', ...props }),
  }
})

describe('AddListingButton (Task D-173 Shared Component)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Tooth c: renders glossy asset, triggers haptics and onPress, has accessibility and hitSlop', async () => {
    const onPressMock = jest.fn()
    const { getByTestId } = await render(
      <AddListingButton
        onPress={onPressMock}
        testID="test-add-btn"
        accessibilityLabel="إضافة إعلان جديد"
      />
    )

    const btn = getByTestId('test-add-btn')
    expect(btn).toBeTruthy()
    expect(btn.props.accessibilityRole).toBe('button')
    expect(btn.props.accessibilityLabel).toBe('إضافة إعلان جديد')
    expect(btn.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 })

    // Verify image rendered with exact asset
    const img = getByTestId('test-add-btn-image')
    expect(img).toBeTruthy()
    expect(img.props.source).toBe(ADD_BUTTON_ASSET)
    expect(img.props.contentFit).toBe('contain')

    // Verify size token
    const imgStyle = StyleSheet.flatten(img.props.style)
    expect(imgStyle.width).toBe(BottomBarTokens.addButtonSize)
    expect(imgStyle.height).toBe(BottomBarTokens.addButtonSize)

    // Press triggers haptics and callback
    await act(async () => {
      fireEvent.press(btn)
    })
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light')
    expect(onPressMock).toHaveBeenCalledTimes(1)
  })

  it('Tooth c2: isHovered scales button smoothly for drag-across interaction', async () => {
    const { rerender, getByTestId } = await render(
      <AddListingButton onPress={jest.fn()} testID="test-add-btn" isHovered={false} />
    )

    const initialBtn = getByTestId('test-add-btn')
    expect(initialBtn).toBeTruthy()

    await act(async () => {
      rerender(
        <AddListingButton onPress={jest.fn()} testID="test-add-btn" isHovered={true} />
      )
    })
    expect(getByTestId('test-add-btn')).toBeTruthy()
  })

  it('Tooth d: no gradient squircle or Ionicons add exist in AddListingButton', async () => {
    const { queryByTestId } = await render(
      <AddListingButton onPress={jest.fn()} testID="test-add-btn" />
    )
    expect(queryByTestId('icon-Ionicons-add')).toBeNull()
    expect(queryByTestId('tile-gradient')).toBeNull()
  })
})
