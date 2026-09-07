import React from 'react';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react-native';
import { BusStep3Details } from './BusStep3Details';
import { BusWizardData } from '../../../store/busWizardStore';
import { busesApi } from '../../../api/buses';

jest.setTimeout(20000);

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

jest.mock('../../../api/buses', () => ({
  busesApi: {
    getManufacturers: jest.fn(() =>
      Promise.resolve([
        { id: 'man-1', name: 'Toyota', nameAr: 'تويوتا', country: 'Japan' },
        { id: 'man-2', name: 'Hyundai', nameAr: 'هيونداي', country: 'Korea' },
      ])
    ),
    getModels: jest.fn(() =>
      Promise.resolve([
        { id: 'mod-1', name: 'Coaster', nameAr: 'كوستر', manufacturerId: 'man-1', capacity: 30 },
        { id: 'mod-2', name: 'HiAce', nameAr: 'هاي إيس', manufacturerId: 'man-1', capacity: 15 },
      ])
    ),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light' },
}));

const mockData: BusWizardData = {
  busListingType: 'BUS_SALE',
  busType: 'COASTER',
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

describe('BusStep3Details', () => {
  const mockOnUpdateField = jest.fn();

  const defaultProps = {
    data: mockData,
    errors: {},
    onUpdateField: mockOnUpdateField,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders title and description inputs and updates field on change', async () => {
    await render(<BusStep3Details {...defaultProps} />);

    const titleInput = screen.getByTestId('input-bus-title');
    await act(async () => {
      fireEvent.changeText(titleInput, 'حافلة تويوتا للبيع');
    });
    expect(mockOnUpdateField).toHaveBeenCalledWith('title', 'حافلة تويوتا للبيع');

    const descInput = screen.getByTestId('input-bus-description');
    await act(async () => {
      fireEvent.changeText(descInput, 'حافلة بحالة جيدة جدا');
    });
    expect(mockOnUpdateField).toHaveBeenCalledWith('description', 'حافلة بحالة جيدة جدا');
  });

  it('loads manufacturers from API on mount', async () => {
    await render(<BusStep3Details {...defaultProps} />);
    await waitFor(() => {
      expect(busesApi.getManufacturers).toHaveBeenCalled();
    });
  });

  it('switches to custom make input when clicking manual make button', async () => {
    await render(<BusStep3Details {...defaultProps} />);

    const enableCustomMakeBtn = screen.getByTestId('enable-custom-make-btn');
    await act(async () => {
      fireEvent.press(enableCustomMakeBtn);
    });

    const customMakeInput = screen.getByTestId('custom-make-input');
    expect(customMakeInput).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(customMakeInput, 'ماركة مخصصة');
    });
    expect(mockOnUpdateField).toHaveBeenCalledWith('make', 'ماركة مخصصة');
    expect(mockOnUpdateField).toHaveBeenCalledWith('manufacturerId', null);
  });

  it('switches to custom model input when clicking manual model button', async () => {
    const propsWithMake = {
      ...defaultProps,
      data: {
        ...mockData,
        manufacturerId: 'man-1',
        make: 'تويوتا',
      },
    };

    await render(<BusStep3Details {...propsWithMake} />);

    const enableCustomModelBtn = screen.getByTestId('enable-custom-model-btn');
    await act(async () => {
      fireEvent.press(enableCustomModelBtn);
    });

    const customModelInput = screen.getByTestId('custom-model-input');
    expect(customModelInput).toBeTruthy();

    await act(async () => {
      fireEvent.changeText(customModelInput, 'موديل مخصص');
    });
    expect(mockOnUpdateField).toHaveBeenCalledWith('model', 'موديل مخصص');
    expect(mockOnUpdateField).toHaveBeenCalledWith('modelId', null);
  });

  it('toggles feature chips correctly', async () => {
    await render(<BusStep3Details {...defaultProps} />);

    const acFeature = screen.getByTestId('feature-ac');
    await act(async () => {
      fireEvent.press(acFeature);
    });
    expect(mockOnUpdateField).toHaveBeenCalledWith('features', ['ac']);
  });

  it('updates transmission, fuel type, and condition', async () => {
    await render(<BusStep3Details {...defaultProps} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('transmission-AUTOMATIC'));
    });
    expect(mockOnUpdateField).toHaveBeenCalledWith('transmission', 'AUTOMATIC');

    await act(async () => {
      fireEvent.press(screen.getByTestId('fuel-PETROL'));
    });
    expect(mockOnUpdateField).toHaveBeenCalledWith('fuelType', 'PETROL');

    await act(async () => {
      fireEvent.press(screen.getByTestId('condition-NEW'));
    });
    expect(mockOnUpdateField).toHaveBeenCalledWith('condition', 'NEW');
  });

  it('displays validation errors when passed in errors prop', async () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        title: 'الرجاء كتابة العنوان',
        make: 'الرجاء اختيار الماركة',
        model: 'الرجاء إدخال الموديل',
        year: 'الرجاء إدخال سنة الصنع',
      },
    };

    await render(<BusStep3Details {...propsWithErrors} />);

    expect(screen.getByText('الرجاء كتابة العنوان')).toBeTruthy();
    expect(screen.getByText('الرجاء اختيار الماركة')).toBeTruthy();
    expect(screen.getByText('الرجاء إدخال الموديل')).toBeTruthy();
    expect(screen.getByText('الرجاء إدخال سنة الصنع')).toBeTruthy();
  });
});
