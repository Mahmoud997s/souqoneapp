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
})
