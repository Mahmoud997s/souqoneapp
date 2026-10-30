import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MyListingCardDispatcher } from '../MyListingCardDispatcher'
import type { MyListingItem } from '../../../../types/my-listings.types'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  router: { push: jest.fn() },
}))

describe('MyListingCardDispatcher - Parity and Wrapper Removal', () => {
  const mockHandlers = {
    onView: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onStatusChange: jest.fn(),
    onCancelDeletionRequest: jest.fn(),
    isEditSupported: true,
  }

  const sampleServiceListing: MyListingItem = {
    id: 'svc-1',
    entityType: 'service',
    normalizedStatus: 'active',
    rawStatus: 'ACTIVE',
    title: 'تصليح وصيانة كهرباء سيارات',
    updatedAt: new Date().toISOString(),
    raw: {
      providerName: 'كراج النور',
      providerType: 'WORKSHOP',
      serviceType: 'MAINTENANCE',
    },
    mapped: {
      id: 'svc-1',
      category: 'service',
      title: 'تصليح وصيانة كهرباء سيارات',
      price: 15,
      currency: 'OMR',
      governorate: 'مسقط',
      images: [],
      raw: {
        providerName: 'كراج النور',
        providerType: 'WORKSHOP',
        serviceType: 'MAINTENANCE',
      },
    },
  }

  const sampleOperatorListing: MyListingItem = {
    id: 'op-1',
    entityType: 'operator',
    normalizedStatus: 'active',
    rawStatus: 'ACTIVE',
    title: 'مشغل رافعة شوكية محترف',
    updatedAt: new Date().toISOString(),
    raw: {
      dailyRate: 35,
      operatorType: 'HEAVY_EQUIPMENT',
      experienceYears: 5,
      user: {
        displayName: 'سالم المعمري',
      },
    },
    mapped: {
      id: 'op-1',
      category: 'operator',
      title: 'مشغل رافعة شوكية محترف',
      price: 35,
      currency: 'OMR',
      governorate: 'صحار',
      images: [],
      raw: {
        dailyRate: 35,
        operatorType: 'HEAVY_EQUIPMENT',
        experienceYears: 5,
        user: {
          displayName: 'سالم المعمري',
        },
      },
    },
  }

  it('renders ServiceCard directly without overlayContainer or cardTopActionOverlay wrappers', async () => {
    const { toJSON } = await render(
      <QueryClientProvider client={queryClient}>
        <MyListingCardDispatcher
          item={sampleServiceListing}
          fullWidth={true}
          {...mockHandlers}
        />
      </QueryClientProvider>
    )

    // Service title rendered
    expect(screen.getByText('تصليح وصيانة كهرباء سيارات')).toBeTruthy()

    // Root element is the ServiceCard (ListingCardBase root View), not an overlayContainer wrapper
    const json: any = toJSON()
    expect(json.type).toBe('View')
    // No top action overlay wrapper
    expect(json.props.children).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ props: expect.objectContaining({ style: expect.objectContaining({ top: 12, left: 12 }) }) })
      ])
    )

    // Confirm action buttons exist inside the card
    expect(screen.getByLabelText('حذف الإعلان')).toBeTruthy()
    expect(screen.getByLabelText('تعديل الإعلان')).toBeTruthy()
  })

  it('returns null and does not render OperatorCard when item.entityType is operator (D-154)', async () => {
    const { toJSON } = await render(
      <QueryClientProvider client={queryClient}>
        <MyListingCardDispatcher
          item={sampleOperatorListing}
          fullWidth={true}
          {...mockHandlers}
        />
      </QueryClientProvider>
    )

    expect(toJSON()).toBeNull()
    expect(screen.queryByTestId('operator-card')).toBeNull()
  })
})
