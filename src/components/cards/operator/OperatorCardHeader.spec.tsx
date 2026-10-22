import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { View, Text } from 'react-native'
import { OperatorCardHeader } from './OperatorCardHeader'

describe('OperatorCardHeader', () => {
  it('renders avatar, name, location, and price in public mode', async () => {
    await render(
      <OperatorCardHeader
        name="سالم الشبيبي"
        avatarUrl="https://example.com/avatar.jpg"
        isVerified={true}
        locationDisplay="مسقط، السيب"
        isOwnerMode={false}
        displayPrice="50 ر.ع. / يوم"
      />
    )

    expect(screen.getByText('سالم الشبيبي')).toBeTruthy()
    expect(screen.getByText('مسقط، السيب')).toBeTruthy()
    expect(screen.getByText('50 ر.ع. / يوم')).toBeTruthy()
    expect(screen.getByTestId('operator-avatar')).toBeTruthy()
    expect(screen.getByTestId('operator-verified-badge')).toBeTruthy()
  })

  it('renders actionMenu in owner mode instead of price badge', async () => {
    await render(
      <OperatorCardHeader
        name="سالم الشبيبي"
        isVerified={false}
        locationDisplay="صلالة"
        isOwnerMode={true}
        displayPrice="50 ر.ع."
        actionMenu={<Text testID="menu-test">MENU</Text>}
      />
    )

    expect(screen.getByTestId('menu-test')).toBeTruthy()
    expect(screen.queryByText('50 ر.ع.')).toBeNull()
  })
})
