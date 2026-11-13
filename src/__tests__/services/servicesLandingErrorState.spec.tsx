import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ServicesLandingScreen from '../../../app/services/index'
import { useServices } from '../../hooks/useServices'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), canGoBack: () => false }),
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('../../hooks/useScrollAwareNav', () => ({
  useScrollAwareNav: () => ({
    scrollHandler: jest.fn(),
    scrollY: { value: 0 },
  }),
}))

jest.mock('../../components/navigation/glassSupport', () => ({
  useGlassSupport: () => ({ isSupported: false }),
}))

jest.mock('../../components/ui/AnimatedHeroHeader', () => ({
  AnimatedHeroHeader: () => null,
}))

jest.mock('../../components/services/ServicesCategoriesGrid', () => ({
  ServicesCategoriesGrid: () => null,
}))

jest.mock('../../components/services/ServicesHowItWorks', () => ({
  ServicesHowItWorks: () => null,
}))

jest.mock('../../components/services/ServicesBottomBar', () => ({
  ServicesBottomBar: () => null,
}))

jest.mock('../../components/ui/SectionFooterAction', () => ({
  SectionFooterAction: () => null,
}))

jest.mock('../../components/services/ServiceCard', () => ({
  ServiceCard: ({ item }: { item: any }) => {
    const { Text, View } = require('react-native')
    return (
      <View testID={`service-landing-card-${item.id}`}>
        <Text>{item.title}</Text>
      </View>
    )
  },
}))

jest.mock('../../hooks/useServices')

const mockedUseServices = jest.mocked(useServices)

async function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Services Landing Screen Error and Stale States (D-262)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders horizontal error state with retry when base query fails with no cached items', async () => {
    const refetchMock = jest.fn()
    mockedUseServices.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network timeout'),
      refetch: refetchMock,
      isRefetchError: false,
      isRefetching: false,
    } as any)

    const { getByTestId, queryByTestId, getByText } = await renderWithClient(
      <ServicesLandingScreen />
    )

    expect(getByTestId('services-horizontal-error-state')).toBeTruthy()
    expect(queryByTestId('services-horizontal-empty-state')).toBeNull()

    fireEvent.press(getByText('إعادة المحاولة'))
    expect(refetchMock).toHaveBeenCalledTimes(1)
  })

  it('preserves cached home services and renders StaleDataBanner when background refetch fails', async () => {
    const refetchBaseMock = jest.fn()
    const refetchSecondaryMock = jest.fn()

    mockedUseServices.mockImplementation((params?: Record<string, unknown>) => {
      if (!params?.serviceType) {
        return {
          data: [
            {
              id: 'svc-home-1',
              title: 'صيانة متنقلة أمام المنزل',
              raw: { isHomeService: true },
            },
          ],
          isLoading: false,
          isError: true,
          error: new Error('Refresh failed'),
          refetch: refetchBaseMock,
          isRefetchError: true,
          isRefetching: false,
        } as any
      }

      return {
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: refetchSecondaryMock,
        isRefetchError: false,
        isRefetching: false,
      } as any
    })

    const { getAllByTestId, getByTestId, queryByTestId } = await renderWithClient(
      <ServicesLandingScreen />
    )

    expect(getByTestId('service-landing-card-svc-home-1')).toBeTruthy()
    const banners = getAllByTestId('stale-data-banner')
    expect(banners.length).toBeGreaterThanOrEqual(1)

    const retryButtons = getAllByTestId('stale-data-retry-button')
    fireEvent.press(retryButtons[0])
    expect(refetchBaseMock).toHaveBeenCalledTimes(1)
    expect(refetchSecondaryMock).not.toHaveBeenCalled()

    expect(queryByTestId('services-horizontal-error-state')).toBeNull()
  })
})
