import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { LocationCard } from './LocationCard'

jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve() as any)

describe('LocationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders location text and title properly', async () => {
    await render(<LocationCard locationText="مسقط، السيب" />)
    expect(screen.getByText('الموقع والعنوان')).toBeTruthy()
    expect(screen.getByText('مسقط، السيب')).toBeTruthy()
  })

  it('renders directions button when coordinates are valid numbers and opens maps URL on press', async () => {
    await render(
      <LocationCard
        locationText="مسقط، الخوير"
        latitude={23.588}
        longitude={58.3829}
      />
    )
    const btn = screen.getByTestId('equipment-directions-button')
    expect(btn).toBeTruthy()

    fireEvent.press(btn)
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=23.588,58.3829'
    )
  })

  it('does NOT render directions button when coordinates are missing or undefined', async () => {
    await render(
      <LocationCard
        locationText="صلالة"
      />
    )
    expect(screen.queryByTestId('equipment-directions-button')).toBeNull()
  })

  it('renders embedded map when coordinates are present, alongside address and directions', async () => {
    await render(
      <LocationCard
        locationText="مسقط، بوشر"
        latitude={23.58}
        longitude={58.4}
      />
    )
    expect(screen.getByTestId('location-map-container')).toBeTruthy()
    expect(screen.getByText('مسقط، بوشر')).toBeTruthy()
    expect(screen.getByTestId('equipment-directions-button')).toBeTruthy()
  })

  it('does NOT render map container when coordinates are missing and keeps text-only card', async () => {
    await render(<LocationCard locationText="نزوى" />)
    expect(screen.queryByTestId('location-map-container')).toBeNull()
    expect(screen.getByText('نزوى')).toBeTruthy()
    expect(screen.queryByTestId('equipment-directions-button')).toBeNull()
  })
})
