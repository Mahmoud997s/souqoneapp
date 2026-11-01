import React from 'react'
import { Linking, StyleSheet } from 'react-native'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { ServiceWebsiteCard } from '../ServiceWebsiteCard'
import { dialogService } from '../../../../store/dialogStore'
import { Colors } from '../../../../constants/colors'
import { Spacing } from '../../../../constants/spacing'

jest.setTimeout(15000)

describe('ServiceWebsiteCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns null when website is undefined', async () => {
    await render(<ServiceWebsiteCard website={undefined} />)
    expect(screen.queryByTestId('service-website-card')).toBeNull()
  })

  it('returns null when website.url is empty', async () => {
    await render(
      <ServiceWebsiteCard
        website={{ url: '', displayUrl: '' }}
      />,
    )
    expect(screen.queryByTestId('service-website-card')).toBeNull()
  })

  it('renders website display URL and opens link on press', async () => {
    const canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true)
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)

    await render(
      <ServiceWebsiteCard
        website={{
          url: 'https://garage-muscat.om',
          displayUrl: 'garage-muscat.om',
        }}
      />,
    )

    expect(screen.getByTestId('service-website-card')).toBeTruthy()
    expect(screen.getByText('garage-muscat.om')).toBeTruthy()

    const linkBtn = screen.getByTestId('service-website-link')
    await act(async () => {
      fireEvent.press(linkBtn)
    })

    expect(canOpenSpy).toHaveBeenCalledWith('https://garage-muscat.om')
    expect(openSpy).toHaveBeenCalledWith('https://garage-muscat.om')
  })

  it('shows error dialog when canOpenURL returns false', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false)
    const alertSpy = jest.spyOn(dialogService, 'alert').mockImplementation(() => {})

    await render(
      <ServiceWebsiteCard
        website={{
          url: 'https://broken-url.com',
          displayUrl: 'broken-url.com',
        }}
      />,
    )

    const linkBtn = screen.getByTestId('service-website-link')
    await act(async () => {
      fireEvent.press(linkBtn)
    })

    expect(alertSpy).toHaveBeenCalledWith('تنبيه', 'تعذر فتح الرابط المطلوب', 'error')
  })

  it('shows error dialog when Linking throws an error', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockRejectedValue(new Error('Network failure'))
    const alertSpy = jest.spyOn(dialogService, 'alert').mockImplementation(() => {})

    await render(
      <ServiceWebsiteCard
        website={{
          url: 'https://error-url.com',
          displayUrl: 'error-url.com',
        }}
      />,
    )

    const linkBtn = screen.getByTestId('service-website-link')
    await act(async () => {
      fireEvent.press(linkBtn)
    })

    expect(alertSpy).toHaveBeenCalledWith('تنبيه', 'حدث خطأ أثناء فتح الرابط', 'error')
  })

  describe('Card Spacing and Visual Tokens (D-170b)', () => {
    it('applies Spacing.space4 horizontal margin and Spacing.space2 vertical margin (Req a)', async () => {
      await render(
        <ServiceWebsiteCard
          website={{
            url: 'https://myservice.om',
            displayUrl: 'myservice.om',
          }}
        />,
      )
      const card = screen.getByTestId('service-website-card')
      const flatStyle = StyleSheet.flatten(card.props.style)
      expect(flatStyle.marginHorizontal).toBe(Spacing.space4)
      expect(flatStyle.marginVertical).toBe(Spacing.space2)
    })

    it('uses Colors.white background and card border matching Cars and Parts (Req b)', async () => {
      await render(
        <ServiceWebsiteCard
          website={{
            url: 'https://myservice.om',
            displayUrl: 'myservice.om',
          }}
        />,
      )
      const card = screen.getByTestId('service-website-card')
      const flatStyle = StyleSheet.flatten(card.props.style)
      expect(flatStyle.backgroundColor).toBe(Colors.white)
      expect(flatStyle.borderWidth).toBe(1)
      expect(flatStyle.borderColor).toBe(Colors.border)
    })
  })
})
