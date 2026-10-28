import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react-native'
import { DetailSkeleton } from '../DetailSkeleton'

describe('DetailSkeleton', () => {
  const onBack = jest.fn()

  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('renders all skeleton placeholder sections correctly', async () => {
    await render(<DetailSkeleton onBack={onBack} />)

    expect(screen.getByTestId('detail-skeleton')).toBeTruthy()
    expect(screen.getByTestId('detail-skeleton-top-bar')).toBeTruthy()
    expect(screen.getByTestId('skeleton-gallery-block')).toBeTruthy()
    expect(screen.getByTestId('skeleton-title-line')).toBeTruthy()
    expect(screen.getByTestId('skeleton-price-block')).toBeTruthy()
    expect(screen.getByTestId('skeleton-seller-card')).toBeTruthy()
    expect(screen.getByTestId('skeleton-bottom-bar')).toBeTruthy()
  })

  it('triggers onBack when top bar back button is pressed', async () => {
    await render(<DetailSkeleton onBack={onBack} />)

    const backButton = screen.getByTestId('nav-back-button')
    await fireEvent.press(backButton)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('does not render top bar when onBack is not provided', async () => {
    await render(<DetailSkeleton />)

    expect(screen.queryByTestId('detail-skeleton-top-bar')).toBeNull()
    expect(screen.getByTestId('skeleton-gallery-block')).toBeTruthy()
  })

  it('honors reduced motion with static fallback', async () => {
    await render(<DetailSkeleton fallbackReducedMotion={true} />)
    const animatedBody = screen.getByTestId('detail-skeleton-animated-body')
    expect(animatedBody).toBeTruthy()
    expect(animatedBody.props.style).toEqual(
      expect.objectContaining({
        opacity: expect.anything(),
      })
    )
  })

  it('allows custom testID prop', async () => {
    await render(<DetailSkeleton testID="custom-skeleton-id" />)
    expect(screen.getByTestId('custom-skeleton-id')).toBeTruthy()
  })
})
