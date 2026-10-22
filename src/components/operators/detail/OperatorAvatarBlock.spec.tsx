import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { OperatorAvatarBlock } from './OperatorAvatarBlock'

describe('OperatorAvatarBlock', () => {
  it('renders image when avatarUrl is provided', async () => {
    await render(<OperatorAvatarBlock avatarUrl="https://example.com/pic.jpg" isVerified={true} />)
    expect(screen.getByTestId('operator-avatar-image')).toBeTruthy()
    expect(screen.getByTestId('operator-verified-badge')).toBeTruthy()
  })

  it('renders fallback icon when avatarUrl is absent', async () => {
    await render(<OperatorAvatarBlock avatarUrl={null} isVerified={false} />)
    expect(screen.getByTestId('operator-avatar-fallback')).toBeTruthy()
    expect(screen.queryByTestId('operator-verified-badge')).toBeNull()
  })

  it('renders verified badge with accessible prop and accessibilityLabel when isVerified is true', async () => {
    await render(<OperatorAvatarBlock avatarUrl={null} isVerified={true} />)
    const badge = screen.getByTestId('operator-verified-badge')
    expect(badge.props.accessible).toBe(true)
    expect(badge.props.accessibilityLabel).toBe('حساب موثق')
  })
})
