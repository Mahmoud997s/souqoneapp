import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import { PartStep6Review } from './PartStep6Review';
import { defaultPartFormData } from '../../../store/partWizardStore';
import { CarBrand } from '../../../api/cars';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('expo-image', () => ({
  Image: ({ source, testID }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return <View testID={testID || 'expo-image'} />;
  },
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children, testID }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return <View testID={testID}>{children}</View>;
  },
}));

const mockBrands: CarBrand[] = [
  { id: '1', name: 'Toyota', nameAr: 'تويوتا', slug: 'toyota', isPopular: true, modelCount: 10 },
  { id: '2', name: 'Nissan', nameAr: 'نيسان', slug: 'nissan', isPopular: true, modelCount: 8 },
  { id: '3', name: 'Honda', nameAr: 'هوندا', slug: 'honda', isPopular: false, modelCount: 5 },
];

describe('PartStep6Review', () => {
  const mockOnEditStep = jest.fn();

  const defaultProps = {
    formData: defaultPartFormData,
    onEditStep: mockOnEditStep,
    brands: mockBrands,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders basic review cards without compatibility card in default state', async () => {
    await render(<PartStep6Review {...defaultProps} />);

    expect(screen.getByText(/الصور والمرفقات/)).toBeTruthy();
    expect(screen.getByText(/البيانات الأساسية/)).toBeTruthy();
    expect(screen.getByText(/مواصفات وتفاصيل القطعة/)).toBeTruthy();
    expect(screen.getByText(/السعر والموقع والتواصل/)).toBeTruthy();

    // Card 4 must NOT be rendered when compatibility fields are empty
    expect(screen.queryByTestId('compatibility-card')).toBeNull();
  });

  it('renders compatibility card when compatibleVehicleTypes is populated', async () => {
    const props = {
      ...defaultProps,
      formData: {
        ...defaultPartFormData,
        compatibleVehicleTypes: ['CAR', 'BUS'] as any,
      },
    };

    await render(<PartStep6Review {...props} />);

    expect(screen.getByTestId('compatibility-card')).toBeTruthy();
    expect(screen.getByText('سيارات')).toBeTruthy();
    expect(screen.getByText('باصات')).toBeTruthy();
  });

  it('renders brand Arabic names from brands prop', async () => {
    const props = {
      ...defaultProps,
      formData: {
        ...defaultPartFormData,
        compatibleMakes: ['1', '2'],
        compatibleModels: ['كامري', 'التيما'],
        yearFrom: 2018,
        yearTo: 2024,
      },
    };

    await render(<PartStep6Review {...props} />);

    expect(screen.getByTestId('compatibility-card')).toBeTruthy();
    expect(screen.getByText('تويوتا، نيسان')).toBeTruthy();
    expect(screen.getByText('كامري، التيما')).toBeTruthy();
    expect(screen.getByText(/من 2018 إلى 2024/)).toBeTruthy();
  });

  it('renders "متوافق مع جميع الماركات" when compatibleMakes includes "all"', async () => {
    const props = {
      ...defaultProps,
      formData: {
        ...defaultPartFormData,
        compatibleMakes: ['all'],
      },
    };

    await render(<PartStep6Review {...props} />);

    expect(screen.getByTestId('compatibility-card')).toBeTruthy();
    expect(screen.getByText('متوافق مع جميع الماركات')).toBeTruthy();
  });

  it('renders "بدون ضمان" when hasWarranty is false', async () => {
    const propsWithoutWarranty = {
      ...defaultProps,
      formData: {
        ...defaultPartFormData,
        hasWarranty: false,
      },
    };

    await render(<PartStep6Review {...propsWithoutWarranty} />);
    expect(screen.getByText('بدون ضمان')).toBeTruthy();
  });

  it('renders warranty duration when hasWarranty is true', async () => {
    const propsWithWarranty = {
      ...defaultProps,
      formData: {
        ...defaultPartFormData,
        hasWarranty: true,
        warrantyDuration: 'SIX_MONTHS' as const,
      },
    };

    await render(<PartStep6Review {...propsWithWarranty} />);
    expect(screen.getByText('6 أشهر')).toBeTruthy();
  });

  it('invokes onEditStep with correct step numbers when edit buttons are pressed', async () => {
    const fullProps = {
      ...defaultProps,
      formData: {
        ...defaultPartFormData,
        compatibleVehicleTypes: ['CAR'] as const as any,
      },
    };

    await render(<PartStep6Review {...fullProps} />);

    // Step 2: Photos
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-photos'));
    });
    expect(mockOnEditStep).toHaveBeenCalledWith(2);

    // Step 1: Basic Info
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-basic'));
    });
    expect(mockOnEditStep).toHaveBeenCalledWith(1);

    // Step 1: Classification (Inside details card)
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-classification'));
    });
    expect(mockOnEditStep).toHaveBeenCalledWith(1);

    // Step 3: Details (Inside details card)
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-details'));
    });
    expect(mockOnEditStep).toHaveBeenCalledWith(3);

    // Step 4: Compatibility
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-compatibility'));
    });
    expect(mockOnEditStep).toHaveBeenCalledWith(4);

    // Step 5: Pricing
    await act(async () => {
      fireEvent.press(screen.getByTestId('edit-step-pricing'));
    });
    expect(mockOnEditStep).toHaveBeenCalledWith(5);
  });
});
