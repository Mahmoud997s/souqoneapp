import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { CarStep4Location } from './CarStep4Location'
import { useCarWizardStore } from '../../../store/carWizardStore'
import { carListingToFormData } from '../../../utils/listing-detail/carListingToFormData'
import type { CarFormData } from '../../../types/carForm.types'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))
jest.mock('expo-blur', () => ({ BlurView: ({ children }: any) => <>{children}</> }))
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}))
jest.mock('../../ui/GovernorateWilayaSelect', () => ({ GovernorateWilayaSelect: () => null }))
jest.mock('../../ui/MapLocationPicker', () => ({ MapLocationPicker: () => null }))

const onUpdateField = jest.fn()
const onLocationChange = jest.fn()

const renderStep = async (formData: CarFormData) =>
  render(
    <CarStep4Location
      formData={formData}
      errors={{}}
      onUpdateField={onUpdateField}
      onLocationChange={onLocationChange}
    />,
  )

const freshForm = (): CarFormData => ({ ...useCarWizardStore.getState().formData })

describe('Car wizard - WhatsApp switch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useCarWizardStore.getState().resetForm?.()
  })

  it('new listing: store default is OFF', () => {
    expect(freshForm().whatsappEnabled).toBe(false)
  })

  it.each(['SALE', 'RENTAL', 'WANTED'])('shows the switch (with the account-phone hint) for listingType=%s', async (listingType) => {
    await renderStep({ ...freshForm(), listingType })
    expect(screen.getByTestId('whatsapp-enabled-switch')).toBeTruthy()
    expect(screen.getByText('تفعيل الواتساب للتواصل')).toBeTruthy()
    expect(screen.getByText(/رقم هاتف حسابك المسجل/)).toBeTruthy()
  })

  it('new listing: switch opens OFF', async () => {
    await renderStep({ ...freshForm(), listingType: 'SALE' })
    expect(screen.getByTestId('whatsapp-enabled-switch').props.value).toBe(false)
  })

  it('edit of a car whose WhatsApp is already enabled: switch opens ON', async () => {
    await renderStep({ ...freshForm(), listingType: 'SALE', whatsappEnabled: true })
    expect(screen.getByTestId('whatsapp-enabled-switch').props.value).toBe(true)
  })

  it('toggling updates only whatsappEnabled', async () => {
    await renderStep({ ...freshForm(), listingType: 'SALE' })
    await act(async () => {
      fireEvent(screen.getByTestId('whatsapp-enabled-switch'), 'valueChange', true)
    })
    expect(onUpdateField).toHaveBeenCalledWith('whatsappEnabled', true)
    expect(onUpdateField).toHaveBeenCalledTimes(1)
  })

  it('has no phone text inputs', async () => {
    await renderStep({ ...freshForm(), listingType: 'SALE' })
    expect(screen.queryByTestId('contact-phone-input')).toBeNull()
    expect(screen.queryByTestId('whatsapp-input')).toBeNull()
  })
})

describe('carListingToFormData - whatsappEnabled (edit entry from the detail screen)', () => {
  const raw = (over: Record<string, any>) => ({ id: 'c1', listingType: 'SALE', ...over }) as any

  it.each([
    [true, true],
    [false, false],
    [null, false],
    [undefined, false],
  ])('raw.whatsappEnabled=%p -> form %p', (input, expected) => {
    expect(carListingToFormData(raw({ whatsappEnabled: input })).whatsappEnabled).toBe(expected)
  })

  it('applies to every listing type (not only rentals)', () => {
    for (const listingType of ['SALE', 'RENTAL', 'WANTED']) {
      expect(carListingToFormData(raw({ listingType, whatsappEnabled: true })).whatsappEnabled).toBe(true)
    }
  })
})
