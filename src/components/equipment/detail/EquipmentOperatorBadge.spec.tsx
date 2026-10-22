import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { EquipmentOperatorBadge } from './EquipmentOperatorBadge'
import type { EquipmentOperatorBadge as EquipmentOperatorBadgeType } from '../../../types/equipmentDetailViewModel.types'

describe('EquipmentOperatorBadge', () => {
  it('returns null when badge is null or undefined', async () => {
    const res = await render(<EquipmentOperatorBadge badge={null} />)
    expect(res.toJSON()).toBeNull()

    const resUndef = await render(
      <EquipmentOperatorBadge badge={undefined as unknown as EquipmentOperatorBadgeType | null} />
    )
    expect(resUndef.toJSON()).toBeNull()
  })

  it('renders positive pill with label for "with" operator badge', async () => {
    const badge: EquipmentOperatorBadgeType = {
      kind: 'with',
      label: 'مع مشغّل',
    }
    await render(<EquipmentOperatorBadge badge={badge} />)

    const badgeElement = screen.getByTestId('equipment-operator-badge')
    expect(badgeElement).toBeTruthy()
    expect(screen.getByText('مع مشغّل')).toBeTruthy()
  })

  it('renders neutral pill with label for "without" operator badge', async () => {
    const badge: EquipmentOperatorBadgeType = {
      kind: 'without',
      label: 'بدون مشغّل',
    }
    await render(<EquipmentOperatorBadge badge={badge} />)

    const badgeElement = screen.getByTestId('equipment-operator-badge')
    expect(badgeElement).toBeTruthy()
    expect(screen.getByText('بدون مشغّل')).toBeTruthy()
  })
})
