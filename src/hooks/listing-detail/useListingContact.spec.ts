import React from 'react'
import { View, TouchableOpacity, Text, Linking } from 'react-native'
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react-native'
import { useListingContact } from './useListingContact'
import { contactApi } from '../../api/contact'
import { chatApi } from '../../api/chat'
import { useAuthStore } from '../../store/authStore'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('../../api/contact', () => ({
  contactApi: {
    getContact: jest.fn(),
  },
}))

jest.mock('../../api/chat', () => ({
  chatApi: {
    createRoom: jest.fn(),
  },
}))

function TestContactHarness({
  entityType = 'LISTING',
  id = 'car-123',
  redirectPath = '/listings/car-123',
}: {
  entityType?: string
  id?: string
  redirectPath?: string
}) {
  const { busy, error, call, whatsApp, chat } = useListingContact(entityType, id, redirectPath)

  return React.createElement(
    View,
    null,
    React.createElement(
      TouchableOpacity,
      { testID: 'btn-call', onPress: call },
      React.createElement(Text, null, 'Call')
    ),
    React.createElement(
      TouchableOpacity,
      { testID: 'btn-whatsapp', onPress: whatsApp },
      React.createElement(Text, null, 'WhatsApp')
    ),
    React.createElement(
      TouchableOpacity,
      { testID: 'btn-chat', onPress: chat },
      React.createElement(Text, null, 'Chat')
    ),
    React.createElement(Text, { testID: 'busy-status' }, busy ? 'BUSY' : 'IDLE'),
    React.createElement(Text, { testID: 'error-status' }, error || 'NO_ERROR')
  )
}

describe('useListingContact', () => {
  let openUrlSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any)
    useAuthStore.setState({ isLoggedIn: true, user: { id: 'u1' } as any })
  })

  afterEach(() => {
    cleanup()
    openUrlSpy.mockRestore()
  })

  describe('Guest user flow (useRequireAuth gating)', () => {
    beforeEach(() => {
      useAuthStore.setState({ isLoggedIn: false, user: null })
    })

    it('guest calling call() redirects to login carrying redirect param and skips contactApi', async () => {
      await render(React.createElement(TestContactHarness))

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-call'))
      })

      expect(mockPush).toHaveBeenCalledWith('/(auth)/login?redirect=%2Flistings%2Fcar-123')
      expect(contactApi.getContact).not.toHaveBeenCalled()
      expect(openUrlSpy).not.toHaveBeenCalled()
    })

    it('guest calling whatsApp() redirects to login carrying redirect param', async () => {
      await render(React.createElement(TestContactHarness))

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-whatsapp'))
      })

      expect(mockPush).toHaveBeenCalledWith('/(auth)/login?redirect=%2Flistings%2Fcar-123')
      expect(contactApi.getContact).not.toHaveBeenCalled()
      expect(openUrlSpy).not.toHaveBeenCalled()
    })

    it('guest calling chat() redirects to login carrying redirect param and skips chatApi', async () => {
      await render(React.createElement(TestContactHarness))

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-chat'))
      })

      expect(mockPush).toHaveBeenCalledWith('/(auth)/login?redirect=%2Flistings%2Fcar-123')
      expect(chatApi.createRoom).not.toHaveBeenCalled()
    })
  })

  describe('Authenticated user — Phone & WhatsApp present', () => {
    beforeEach(() => {
      ;(contactApi.getContact as jest.Mock).mockResolvedValue({
        data: {
          phone: '+968 9123 4567',
          whatsappNumber: '+968 9123 4567',
        },
      })
    })

    it('call() opens tel: URL with normalized number', async () => {
      await render(React.createElement(TestContactHarness))

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-call'))
      })

      expect(contactApi.getContact).toHaveBeenCalledWith('LISTING', 'car-123')
      expect(openUrlSpy).toHaveBeenCalledWith('tel:+96891234567')
      expect(screen.getByTestId('busy-status')).toHaveTextContent('IDLE')
      expect(screen.getByTestId('error-status')).toHaveTextContent('NO_ERROR')
    })

    it('whatsApp() opens whatsapp://send URL with normalized number', async () => {
      await render(React.createElement(TestContactHarness))

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-whatsapp'))
      })

      expect(contactApi.getContact).toHaveBeenCalledWith('LISTING', 'car-123')
      expect(openUrlSpy).toHaveBeenCalledWith('whatsapp://send?phone=+96891234567')
      expect(screen.getByTestId('busy-status')).toHaveTextContent('IDLE')
    })
  })

  describe('Authenticated user — Fallback cases', () => {
    it('phone is present but whatsappNumber is null: whatsApp() falls back to chat', async () => {
      ;(contactApi.getContact as jest.Mock).mockResolvedValue({
        data: {
          phone: '+96891234567',
          whatsappNumber: null,
        },
      })
      ;(chatApi.createRoom as jest.Mock).mockResolvedValue({
        data: { id: 'room-101' },
      })

      await render(React.createElement(TestContactHarness))

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-whatsapp'))
      })

      // Contact was fetched, found whatsappNumber = null -> fell back to chat
      expect(contactApi.getContact).toHaveBeenCalledWith('LISTING', 'car-123')
      expect(openUrlSpy).not.toHaveBeenCalled()
      expect(chatApi.createRoom).toHaveBeenCalledWith({
        entityType: 'LISTING',
        entityId: 'car-123',
      })
      expect(mockPush).toHaveBeenCalledWith('/chat/room-101')
    })

    it('phone is null: call() falls back to chat', async () => {
      ;(contactApi.getContact as jest.Mock).mockResolvedValue({
        data: {
          phone: null,
          whatsappNumber: null,
        },
      })
      ;(chatApi.createRoom as jest.Mock).mockResolvedValue({
        data: { id: 'room-202' },
      })

      await render(React.createElement(TestContactHarness))

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-call'))
      })

      expect(contactApi.getContact).toHaveBeenCalledWith('LISTING', 'car-123')
      expect(openUrlSpy).not.toHaveBeenCalled()
      expect(chatApi.createRoom).toHaveBeenCalledWith({
        entityType: 'LISTING',
        entityId: 'car-123',
      })
      expect(mockPush).toHaveBeenCalledWith('/chat/room-202')
    })
  })

  describe('Direct chat() action', () => {
    it('chat() starts conversation and navigates to chat room without fetching contact info', async () => {
      ;(chatApi.createRoom as jest.Mock).mockResolvedValue({
        data: { id: 'room-303' },
      })

      await render(React.createElement(TestContactHarness))

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-chat'))
      })

      expect(contactApi.getContact).not.toHaveBeenCalled()
      expect(chatApi.createRoom).toHaveBeenCalledWith({
        entityType: 'LISTING',
        entityId: 'car-123',
      })
      expect(mockPush).toHaveBeenCalledWith('/chat/room-303')
    })
  })

  describe('Error handling & Busy state', () => {
    it('surfaces backend Arabic error message and resets busy on failure', async () => {
      ;(contactApi.getContact as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 404,
          data: {
            statusCode: 404,
            message: 'الإعلان غير موجود أو تم حذفه',
          },
        },
      })

      await render(React.createElement(TestContactHarness))

      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-call'))
      })

      expect(screen.getByTestId('error-status')).toHaveTextContent('الإعلان غير موجود أو تم حذفه')
      expect(screen.getByTestId('busy-status')).toHaveTextContent('IDLE')
    })

    it('busy transitions to true during flight and blocks concurrent taps', async () => {
      let resolveContact: (val: any) => void = () => {}
      const contactPromise = new Promise((resolve) => {
        resolveContact = resolve
      })
      ;(contactApi.getContact as jest.Mock).mockReturnValue(contactPromise)

      await render(React.createElement(TestContactHarness))

      // First tap -> enters flight
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-call'))
      })
      expect(screen.getByTestId('busy-status')).toHaveTextContent('BUSY')
      expect(contactApi.getContact).toHaveBeenCalledTimes(1)

      // Second tap while busy -> ignored
      await act(async () => {
        fireEvent.press(screen.getByTestId('btn-call'))
      })
      expect(contactApi.getContact).toHaveBeenCalledTimes(1)

      // Resolve flight
      await act(async () => {
        resolveContact({ data: { phone: '+96899999999', whatsappNumber: null } })
      })
      await waitFor(() => expect(screen.getByTestId('busy-status')).toHaveTextContent('IDLE'))
    })
  })
})
