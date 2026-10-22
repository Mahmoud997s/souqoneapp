import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { EquipmentDetailNavBar } from './EquipmentDetailNavBar'

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
})
