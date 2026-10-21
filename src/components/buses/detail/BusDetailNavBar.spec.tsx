import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { BusDetailNavBar } from './BusDetailNavBar'

jest.mock('expo-blur', () => {
  const { View } = require('react-native')
  return { BlurView: (props: any) => <View testID="mock-blur" {...props} /> }
})

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return { Ionicons: (props: any) => <View testID="mock-icon" {...props} /> }
})

describe('BusDetailNavBar', () => {
  const mockOnBack = jest.fn()
  const mockOnShare = jest.fn()
  const mockOnToggleFavorite = jest.fn()
  const mockOnSearchChange = jest.fn()
  const mockOnSearchSubmit = jest.fn()

  const defaultProps = {
    onBack: mockOnBack,
    onShare: mockOnShare,
    isFavorite: false,
    favoriteBusy: false,
    canFavorite: true,
    onToggleFavorite: mockOnToggleFavorite,
    searchValue: 'كوستر',
    onSearchChange: mockOnSearchChange,
    onSearchSubmit: mockOnSearchSubmit,
    scrollY: { value: 0 } as any,
    paddingTop: 44,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders navbar buttons and search input and handles interactions', async () => {
    await render(<BusDetailNavBar {...defaultProps} />)

    const backBtn = screen.getByTestId('btn-detail-back')
    const shareBtn = screen.getByTestId('btn-detail-share')
    const favBtn = screen.getByTestId('btn-detail-favorite')
    const input = screen.getByPlaceholderText('ابحث في تفاصيل الحافلة...')

    expect(backBtn).toBeTruthy()
    expect(shareBtn).toBeTruthy()
    expect(favBtn).toBeTruthy()
    expect(input).toBeTruthy()

    fireEvent.press(backBtn)
    expect(mockOnBack).toHaveBeenCalledTimes(1)

    fireEvent.press(shareBtn)
    expect(mockOnShare).toHaveBeenCalledTimes(1)

    fireEvent.press(favBtn)
    expect(mockOnToggleFavorite).toHaveBeenCalledTimes(1)

    fireEvent.changeText(input, 'تويوتا')
    expect(mockOnSearchChange).toHaveBeenCalledWith('تويوتا')
  })
})
