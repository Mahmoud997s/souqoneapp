import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { EquipmentLocationCard } from './EquipmentLocationCard'

describe('EquipmentLocationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as unknown as void)
  })

  it('renders location text without directions button when coordinates are missing', async () => {
    await render(<EquipmentLocationCard locationText="مسقط، السيب" />)

    expect(screen.getByTestId('equipment-location-card')).toBeTruthy()
    expect(screen.getByText('الموقع والعنوان')).toBeTruthy()
    expect(screen.getByText('مسقط، السيب')).toBeTruthy()
    expect(screen.queryByTestId('equipment-directions-button')).toBeNull()
  })

  it('renders directions button and opens google maps URL when coordinates are valid', async () => {
    await render(
      <EquipmentLocationCard
        locationText="صحار، منطقة الميناء"
        latitude={24.36}
        longitude={56.74}
      />
    )

    const directionsBtn = screen.getByTestId('equipment-directions-button')
    expect(directionsBtn).toBeTruthy()
    expect(screen.getByText('الحصول على الاتجاهات')).toBeTruthy()

    fireEvent.press(directionsBtn)
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=24.36,56.74'
    )
  })

  it('does NOT render any MapView or map canvas component', async () => {
    const res = await render(
      <EquipmentLocationCard
        locationText="صلالة، عوقد"
        latitude={17.02}
        longitude={54.09}
      />
    )

    // Verify there is no map component in JSON tree
    const jsonStr = JSON.stringify(res.toJSON())
    expect(jsonStr).not.toContain('MapView')
    expect(jsonStr).not.toContain('AIRMap')
  })
})
