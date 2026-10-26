import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { DetailTopBar, type DetailTopBarProps } from './DetailTopBar'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

describe('DetailTopBar', () => {
  it('renders in normal layout flow and strictly not position: absolute (teeth verified)', async () => {
    await render(<DetailTopBar onBack={jest.fn()} />)

    const bar = screen.getByTestId('detail-top-bar')
    const flatStyle = StyleSheet.flatten(bar.props.style)
    expect(flatStyle.position).not.toBe('absolute')
    expect(flatStyle.position ?? 'relative').toBe('relative')
  })

  it('applies top padding strictly from useSafeAreaInsets().top (teeth verified)', async () => {
    await render(<DetailTopBar onBack={jest.fn()} />)

    const bar = screen.getByTestId('detail-top-bar')
    const flatStyle = StyleSheet.flatten(bar.props.style)
    expect(flatStyle.paddingTop).toBe(44)
  })

  it('renders minimal top bar without share and without search', async () => {
    const onBackMock = jest.fn()
    await render(<DetailTopBar onBack={onBackMock} />)

    const backBtn = screen.getByTestId('nav-back-button')
    expect(backBtn).toBeTruthy()
    fireEvent.press(backBtn)
    expect(onBackMock).toHaveBeenCalledTimes(1)

    expect(screen.queryByTestId('btn-detail-share')).toBeNull()
    expect(screen.queryByTestId('nav-favorite-button')).toBeNull()
    expect(screen.queryByTestId('nav-search-container')).toBeNull()
    expect(screen.queryByTestId('nav-search-input')).toBeNull()
  })

  it('renders share button ONLY when onShare prop is provided', async () => {
    const onShareMock = jest.fn()
    await render(<DetailTopBar onBack={jest.fn()} onShare={onShareMock} />)

    const shareBtn = screen.getByTestId('btn-detail-share')
    expect(shareBtn).toBeTruthy()
    fireEvent.press(shareBtn)
    expect(onShareMock).toHaveBeenCalledTimes(1)
  })

  it('does NOT render share button when onShare prop is omitted', async () => {
    await render(<DetailTopBar onBack={jest.fn()} />)

    expect(screen.queryByTestId('btn-detail-share')).toBeNull()
    expect(screen.queryByLabelText('مشاركة')).toBeNull()
  })

  it('renders search input always interactive with RTL right text alignment', async () => {
    const onSearchChangeMock = jest.fn()
    const onSearchSubmitMock = jest.fn()

    await render(
      <DetailTopBar
        onBack={jest.fn()}
        searchValue="لكزس"
        onSearchChange={onSearchChangeMock}
        onSearchSubmit={onSearchSubmitMock}
        placeholder="ابحث في المواصفات..."
      />
    )

    const searchInput = screen.getByTestId('nav-search-input')
    expect(searchInput).toBeTruthy()
    expect(searchInput.props.textAlign).toBe('right')
    expect(searchInput.props.clearButtonMode).toBeUndefined()

    const flatInputStyle = StyleSheet.flatten(searchInput.props.style)
    expect(flatInputStyle.textAlign).toBe('right')
    expect(flatInputStyle.writingDirection).toBe('rtl')

    await act(async () => {
      fireEvent.changeText(searchInput, 'تويوتا')
    })
    expect(onSearchChangeMock).toHaveBeenCalledWith('تويوتا')

    await act(async () => {
      fireEvent(searchInput, 'submitEditing')
    })
    expect(onSearchSubmitMock).toHaveBeenCalledWith('لكزس')
  })

  it('renders favorite button when canFavorite and onToggleFavorite are provided', async () => {
    const onToggleMock = jest.fn()
    await render(
      <DetailTopBar
        onBack={jest.fn()}
        canFavorite={true}
        onToggleFavorite={onToggleMock}
        isFavorite={false}
      />
    )

    const favBtn = screen.getByTestId('nav-favorite-button')
    expect(favBtn).toBeTruthy()
    await act(async () => {
      fireEvent.press(favBtn)
    })
    expect(onToggleMock).toHaveBeenCalledTimes(1)
  })

  it('handles favorite busy and disabled states correctly', async () => {
    const onToggleMock = jest.fn()
    await render(
      <DetailTopBar
        onBack={jest.fn()}
        canFavorite={true}
        onToggleFavorite={onToggleMock}
        favoriteBusy={true}
        isFavorite={true}
      />
    )

    const favBtn = screen.getByTestId('nav-favorite-button')
    expect(favBtn.props.accessibilityState?.disabled).toBe(true)

    await act(async () => {
      fireEvent.press(favBtn)
    })
    expect(onToggleMock).not.toHaveBeenCalled()
  })

  it('does NOT render favorite button when canFavorite is false (operators / owners)', async () => {
    await render(
      <DetailTopBar
        onBack={jest.fn()}
        canFavorite={false}
      />
    )

    expect(screen.queryByTestId('nav-favorite-button')).toBeNull()
  })

  describe('Discriminated Union Typing Tests', () => {
    it('validates compilation behavior of valid and invalid prop combinations', () => {
      // Valid without search
      const validWithoutSearch: DetailTopBarProps = {
        onBack: () => {},
        canFavorite: false,
      }
      expect(validWithoutSearch).toBeDefined()

      // Valid with search
      const validWithSearch: DetailTopBarProps = {
        onBack: () => {},
        onShare: () => {},
        searchValue: 'camry',
        onSearchChange: () => {},
      }
      expect(validWithSearch).toBeDefined()

      // Invalid: onSearchChange without searchValue
      // @ts-expect-error Types of property 'searchValue' are incompatible - string required when onSearchChange is present
      const invalidMissingSearchValue: DetailTopBarProps = {
        onBack: () => {},
        onSearchChange: () => {},
      }
      expect(invalidMissingSearchValue).toBeDefined()

      // Invalid: searchValue without onSearchChange
      // @ts-expect-error Types of property 'onSearchChange' are incompatible - callback required when searchValue is present
      const invalidMissingOnSearchChange: DetailTopBarProps = {
        onBack: () => {},
        searchValue: 'test',
      }
      expect(invalidMissingOnSearchChange).toBeDefined()
    })
  })
})
