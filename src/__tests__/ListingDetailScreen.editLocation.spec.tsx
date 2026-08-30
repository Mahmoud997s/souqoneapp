import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockSetEditMode = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('../hooks/useListings', () => ({
  useListing: jest.fn(),
}));

jest.mock('../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../store/carWizardStore', () => ({
  useCarWizardStore: {
    getState: () => ({ setEditMode: mockSetEditMode }),
  },
}));

jest.mock('../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}));

jest.mock('../api/chat', () => ({
  chatApi: { createRoom: jest.fn() },
}));

jest.mock('../api/listings', () => ({
  listingsApi: { remove: jest.fn() },
}));

jest.mock('../components/ui/Map', () => {
  const { View } = require('react-native');
  const MockMap = (props: any) => <View {...props} />;
  return {
    __esModule: true,
    default: MockMap,
    Marker: MockMap,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'listing-1' }),
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
    back: (...args: unknown[]) => mockRouterBack(...args),
  },
}));

import { useListing } from '../hooks/useListings';
import { useAuthStore } from '../store/authStore';
import ListingDetailScreen from '../../app/listings/[id]';

const SELLER = {
  id: 'seller-1',
  username: 'seller1',
  displayName: 'بائع تجريبي',
  avatarUrl: null,
  isVerified: false,
  createdAt: '2025-01-01T00:00:00.000Z',
};

function buildCarListing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'listing-1',
    title: 'تويوتا كامري 2020',
    description: 'سيارة نظيفة جداً',
    listingType: 'SALE',
    condition: 'USED',
    year: 2020,
    price: '5000',
    mileage: 50000,
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    bodyType: 'SEDAN',
    exteriorColor: 'white',
    make: 'Toyota',
    model: 'Camry',
    trim: 'SE',
    brandId: 'brand-1',
    carModelId: 'model-1',
    carTrimId: 'trim-1',
    images: [],
    version: 1,
    isPriceNegotiable: false,
    currency: 'OMR',
    seller: SELLER,
    features: [],
    ...overrides,
  };
}

function renderScreen() {
  return render(<ListingDetailScreen />);
}

describe('ListingDetailScreen — handleEditListing location preservation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: SELLER });
  });

  it('passes governorateId through to setEditMode when the listing has one', async () => {
    (useListing as jest.Mock).mockReturnValue({
      data: buildCarListing({
        governorateId: 1,
        wilayaId: 101,
        governorateRef: { nameAr: 'مسقط' },
        wilayaRef: { nameAr: 'السيب' },
      }),
      isLoading: false,
      isError: false,
    });

    await renderScreen();
    await fireEvent.press(screen.getByText('تعديل'));

    expect(mockSetEditMode).toHaveBeenCalledWith(
      'listing-1',
      expect.objectContaining({ governorateId: 1 }),
    );
  });

  it('passes wilayaId through to setEditMode when the listing has one', async () => {
    (useListing as jest.Mock).mockReturnValue({
      data: buildCarListing({
        governorateId: 1,
        wilayaId: 101,
        governorateRef: { nameAr: 'مسقط' },
        wilayaRef: { nameAr: 'السيب' },
      }),
      isLoading: false,
      isError: false,
    });

    await renderScreen();
    await fireEvent.press(screen.getByText('تعديل'));

    expect(mockSetEditMode).toHaveBeenCalledWith(
      'listing-1',
      expect.objectContaining({ wilayaId: 101 }),
    );
  });

  it('passes null (not undefined) for governorateId/wilayaId when the listing has no location', async () => {
    (useListing as jest.Mock).mockReturnValue({
      data: buildCarListing({
        governorateId: undefined,
        wilayaId: undefined,
        governorateRef: undefined,
        wilayaRef: undefined,
      }),
      isLoading: false,
      isError: false,
    });

    await renderScreen();
    await fireEvent.press(screen.getByText('تعديل'));

    expect(mockSetEditMode).toHaveBeenCalledTimes(1);
    const initialData = mockSetEditMode.mock.calls[0][1];
    expect(initialData.governorateId).toBeNull();
    expect(initialData.wilayaId).toBeNull();
    expect(initialData.governorateId).not.toBeUndefined();
    expect(initialData.wilayaId).not.toBeUndefined();
    expect(initialData.governorateName).toBe('');
    expect(initialData.wilayaName).toBe('');
  });
});
