import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BusStep1TypeCategory } from './BusStep1TypeCategory';
import { BusWizardData } from '../../../store/busWizardStore';

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const mockData: BusWizardData = {
  busListingType: '',
  busType: '',
  make: '',
  model: '',
  manufacturerId: null,
  modelId: null,
  year: '',
  capacity: '',
  condition: 'USED',
  transmission: 'MANUAL',
  fuelType: 'DIESEL',
  mileage: '',
  plateNumber: '',
  features: [],
  price: '',
  currency: 'OMR',
  isPriceNegotiable: false,
  dailyPrice: '',
  monthlyPrice: '',
  withDriver: false,
  contractType: 'COMPANY',
  contractClient: '',
  contractMonthly: '',
  contractDuration: '',
  contractExpiry: null,
  title: '',
  description: '',
  governorateId: null,
  wilayaId: null,
  governorateNameAr: '',
  wilayaNameAr: '',
  latitude: null,
  longitude: null,
  images: [],
  existingImages: [],
  removedImageIds: [],
  contactPhone: '',
  whatsapp: '',
};

describe('BusStep1TypeCategory', () => {
  const mockOnUpdateField = jest.fn();

  const defaultProps = {
    data: mockData,
    errors: {},
    onUpdateField: mockOnUpdateField,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders intro banner and section titles correctly', async () => {
    await render(<BusStep1TypeCategory {...defaultProps} />);
    expect(screen.getByText('سوق الحافلات')).toBeTruthy();
    expect(screen.getByText('نوع الإعلان *')).toBeTruthy();
    expect(screen.getByText('فئة الحافلة *')).toBeTruthy();
  });

  it('renders all 3 listing type options', async () => {
    await render(<BusStep1TypeCategory {...defaultProps} />);
    expect(screen.getByTestId('listing-type-BUS_SALE')).toBeTruthy();
    expect(screen.getByTestId('listing-type-BUS_SALE_WITH_CONTRACT')).toBeTruthy();
    expect(screen.getByTestId('listing-type-BUS_RENT')).toBeTruthy();
  });

  it('renders all 5 bus type category options', async () => {
    await render(<BusStep1TypeCategory {...defaultProps} />);
    expect(screen.getByTestId('bus-type-MINI_BUS')).toBeTruthy();
    expect(screen.getByTestId('bus-type-MEDIUM_BUS')).toBeTruthy();
    expect(screen.getByTestId('bus-type-LARGE_BUS')).toBeTruthy();
    expect(screen.getByTestId('bus-type-COASTER')).toBeTruthy();
    expect(screen.getByTestId('bus-type-SCHOOL_BUS')).toBeTruthy();
  });

  it('calls onUpdateField with correct key and value when a listing type is pressed', async () => {
    await render(<BusStep1TypeCategory {...defaultProps} />);
    const saleWithContractOption = screen.getByTestId('listing-type-BUS_SALE_WITH_CONTRACT');
    
    fireEvent.press(saleWithContractOption);
    expect(mockOnUpdateField).toHaveBeenCalledWith('busListingType', 'BUS_SALE_WITH_CONTRACT');
  });

  it('calls onUpdateField with correct key and value when a bus category is pressed', async () => {
    await render(<BusStep1TypeCategory {...defaultProps} />);
    const coasterOption = screen.getByTestId('bus-type-COASTER');

    fireEvent.press(coasterOption);
    expect(mockOnUpdateField).toHaveBeenCalledWith('busType', 'COASTER');
  });

  it('displays validation errors when passed via errors prop', async () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        busListingType: 'الرجاء اختيار نوع الإعلان',
        busType: 'الرجاء اختيار فئة الحافلة',
      },
    };

    await render(<BusStep1TypeCategory {...propsWithErrors} />);

    expect(screen.getByTestId('error-bus-listing-type')).toBeTruthy();
    expect(screen.getByText('الرجاء اختيار نوع الإعلان')).toBeTruthy();
    expect(screen.getByTestId('error-bus-type')).toBeTruthy();
    expect(screen.getByText('الرجاء اختيار فئة الحافلة')).toBeTruthy();
  });
});
