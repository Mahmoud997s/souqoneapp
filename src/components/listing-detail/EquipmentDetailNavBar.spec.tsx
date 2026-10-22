import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { EquipmentDetailNavBar, type EquipmentDetailNavBarProps } from './EquipmentDetailNavBar'

describe('EquipmentDetailNavBar', () => {
  const dummyScrollY = { value: 0 } as unknown as import('react-native-reanimated').SharedValue<number>

  it('renders back button and calls onBack when pressed', async () => {
    const onBackMock = jest.fn()
    await render(
      <EquipmentDetailNavBar
        onBack={onBackMock}
        isFavorite={false}
        favoriteBusy={false}
        canFavorite={true}
        onToggleFavorite={jest.fn()}
        searchValue=""
        onSearchChange={jest.fn()}
        onSearchSubmit={jest.fn()}
        scrollY={dummyScrollY}
        paddingTop={40}
      />
    )

    const backBtn = screen.getByTestId('nav-back-button')
    expect(backBtn).toBeTruthy()
    fireEvent.press(backBtn)
    expect(onBackMock).toHaveBeenCalledTimes(1)
  })

  it('renders favorite button when canFavorite is true and toggles on press', async () => {
    const onToggleMock = jest.fn()
    await render(
      <EquipmentDetailNavBar
        onBack={jest.fn()}
        isFavorite={false}
        favoriteBusy={false}
        canFavorite={true}
        onToggleFavorite={onToggleMock}
        searchValue=""
        onSearchChange={jest.fn()}
        onSearchSubmit={jest.fn()}
        scrollY={dummyScrollY}
        paddingTop={40}
      />
    )

    const favBtn = screen.getByTestId('nav-favorite-button')
    expect(favBtn).toBeTruthy()
    fireEvent.press(favBtn)
    expect(onToggleMock).toHaveBeenCalledTimes(1)
  })

  it('does NOT render favorite button when canFavorite is false (owner)', async () => {
    await render(
      <EquipmentDetailNavBar
        onBack={jest.fn()}
        isFavorite={false}
        favoriteBusy={false}
        canFavorite={false}
        onToggleFavorite={jest.fn()}
        searchValue=""
        onSearchChange={jest.fn()}
        onSearchSubmit={jest.fn()}
        scrollY={dummyScrollY}
        paddingTop={40}
      />
    )

    expect(screen.queryByTestId('nav-favorite-button')).toBeNull()
  })

  it('strictly NEVER renders a share button (approved decision)', async () => {
    await render(
      <EquipmentDetailNavBar
        onBack={jest.fn()}
        isFavorite={false}
        favoriteBusy={false}
        canFavorite={true}
        onToggleFavorite={jest.fn()}
        searchValue=""
        onSearchChange={jest.fn()}
        onSearchSubmit={jest.fn()}
        scrollY={dummyScrollY}
        paddingTop={40}
      />
    )

    expect(screen.queryByTestId('nav-share-button')).toBeNull()
    expect(screen.queryByLabelText(/مشاركة|share/i)).toBeNull()
  })

  it('renders search input when onSearchChange is passed', async () => {
    await render(
      <EquipmentDetailNavBar
        onBack={jest.fn()}
        isFavorite={false}
        favoriteBusy={false}
        canFavorite={true}
        onToggleFavorite={jest.fn()}
        searchValue="test"
        onSearchChange={jest.fn()}
        onSearchSubmit={jest.fn()}
        scrollY={dummyScrollY}
        paddingTop={40}
      />
    )

    expect(screen.getByTestId('nav-search-input')).toBeTruthy()
    expect(screen.getByTestId('nav-search-container')).toBeTruthy()
  })

  it('does NOT render search input when search props are omitted, but back and favorite still work', async () => {
    const onBackMock = jest.fn()
    const onToggleMock = jest.fn()
    await render(
      <EquipmentDetailNavBar
        onBack={onBackMock}
        isFavorite={false}
        favoriteBusy={false}
        canFavorite={true}
        onToggleFavorite={onToggleMock}
        scrollY={dummyScrollY}
        paddingTop={40}
      />
    )

    expect(screen.queryByTestId('nav-search-input')).toBeNull()
    expect(screen.queryByTestId('nav-search-container')).toBeNull()

    // Back button and favorite still fully operational
    const backBtn = screen.getByTestId('nav-back-button')
    fireEvent.press(backBtn)
    expect(onBackMock).toHaveBeenCalledTimes(1)

    const favBtn = screen.getByTestId('nav-favorite-button')
    fireEvent.press(favBtn)
    expect(onToggleMock).toHaveBeenCalledTimes(1)
  })

  describe('Discriminated Union Typing Tests', () => {
    it('validates compilation behavior of valid and invalid prop combinations', () => {
      // Valid without search
      const validWithoutSearch: EquipmentDetailNavBarProps = {
        onBack: () => {},
        isFavorite: false,
        favoriteBusy: false,
        canFavorite: true,
        onToggleFavorite: () => {},
        scrollY: dummyScrollY,
        paddingTop: 40,
      }
      expect(validWithoutSearch).toBeDefined()

      // Valid with search
      const validWithSearch: EquipmentDetailNavBarProps = {
        onBack: () => {},
        isFavorite: false,
        favoriteBusy: false,
        canFavorite: true,
        onToggleFavorite: () => {},
        scrollY: dummyScrollY,
        paddingTop: 40,
        searchValue: 'test',
        onSearchChange: () => {},
      }
      expect(validWithSearch).toBeDefined()

      // Invalid: onSearchChange without searchValue
      // @ts-expect-error Types of property 'searchValue' are incompatible - string is required when onSearchChange is present
      const invalidMissingSearchValue: EquipmentDetailNavBarProps = {
        onBack: () => {},
        isFavorite: false,
        favoriteBusy: false,
        canFavorite: true,
        onToggleFavorite: () => {},
        scrollY: dummyScrollY,
        paddingTop: 40,
        onSearchChange: () => {},
      }
      expect(invalidMissingSearchValue).toBeDefined()

      // Invalid: searchValue without onSearchChange
      // @ts-expect-error Types of property 'onSearchChange' are incompatible - callback is required when searchValue is present
      const invalidMissingOnSearchChange: EquipmentDetailNavBarProps = {
        onBack: () => {},
        isFavorite: false,
        favoriteBusy: false,
        canFavorite: true,
        onToggleFavorite: () => {},
        scrollY: dummyScrollY,
        paddingTop: 40,
        searchValue: 'test',
      }
      expect(invalidMissingOnSearchChange).toBeDefined()
    })
  })
})
