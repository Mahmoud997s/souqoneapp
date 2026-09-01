import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import { PartStep4Compatibility } from './PartStep4Compatibility';
import { defaultPartFormData } from '../../../store/partWizardStore';

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('../../../api/cars', () => ({
  carsApi: {
    getBrands: jest.fn().mockResolvedValue([
      { id: 'toyota', name: 'Toyota', nameAr: 'تويوتا' },
      { id: 'nissan', name: 'Nissan', nameAr: 'نيسان' },
    ]),
    getModels: jest.fn().mockResolvedValue([
      { id: 'camry', name: 'Camry', nameAr: 'كامري' },
      { id: 'corolla', name: 'Corolla', nameAr: 'كورولا' },
    ]),
  },
}));

describe('PartStep4Compatibility', () => {
  const mockOnUpdateField = jest.fn();

  const defaultProps = {
    formData: defaultPartFormData,
    errors: {},
    onUpdateField: mockOnUpdateField,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders vehicle type options and updates store on select', async () => {
    await render(<PartStep4Compatibility {...defaultProps} />);

    const carBtn = screen.getByTestId('vehicle-type-CAR');
    expect(carBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(carBtn);
    });

    expect(mockOnUpdateField).toHaveBeenCalledWith('compatibleVehicleTypes', ['CAR']);
  });

  it('clears compatibleMakes and compatibleModels when unselecting CAR', async () => {
    const propsWithCar = {
      ...defaultProps,
      formData: {
        ...defaultPartFormData,
        compatibleVehicleTypes: ['CAR' as const],
        compatibleMakes: ['toyota'],
        compatibleModels: ['Camry'],
      },
    };

    await render(<PartStep4Compatibility {...propsWithCar} />);

    const carBtn = screen.getByTestId('vehicle-type-CAR');
    await act(async () => {
      fireEvent.press(carBtn);
    });

    expect(mockOnUpdateField).toHaveBeenCalledWith('compatibleVehicleTypes', []);
    expect(mockOnUpdateField).toHaveBeenCalledWith('compatibleMakes', []);
    expect(mockOnUpdateField).toHaveBeenCalledWith('compatibleModels', []);
  });

  it('toggles all-makes chip correctly', async () => {
    const propsWithCar = {
      ...defaultProps,
      formData: {
        ...defaultPartFormData,
        compatibleVehicleTypes: ['CAR' as const],
        compatibleMakes: [],
      },
    };

    await render(<PartStep4Compatibility {...propsWithCar} />);

    const allMakesBtn = screen.getByTestId('all-makes-chip');
    await act(async () => {
      fireEvent.press(allMakesBtn);
    });

    expect(mockOnUpdateField).toHaveBeenCalledWith('compatibleMakes', ['all']);
    expect(mockOnUpdateField).toHaveBeenCalledWith('compatibleModels', []);
  });

  it('allows adding and removing custom models', async () => {
    const propsWithMakes = {
      ...defaultProps,
      formData: {
        ...defaultPartFormData,
        compatibleVehicleTypes: ['CAR' as const],
        compatibleMakes: ['toyota'],
        compatibleModels: ['CustomModel1'],
      },
    };

    await render(<PartStep4Compatibility {...propsWithMakes} />);

    // Add custom model via submitEditing
    const input = screen.getByTestId('custom-model-input');
    await act(async () => {
      fireEvent.changeText(input, 'LandCruiser');
    });

    await act(async () => {
      fireEvent(input, 'submitEditing');
    });

    expect(mockOnUpdateField).toHaveBeenCalledWith('compatibleModels', ['CustomModel1', 'LandCruiser']);

    // Remove existing custom model
    const removeBtn = screen.getByTestId('remove-model-CustomModel1');
    await act(async () => {
      fireEvent.press(removeBtn);
    });

    expect(mockOnUpdateField).toHaveBeenCalledWith('compatibleModels', []);
  });

  it('displays error message for yearTo when provided', async () => {
    const propsWithError = {
      ...defaultProps,
      errors: {
        yearTo: 'سنة النهاية أكبر من سنة البداية',
      },
    };

    await render(<PartStep4Compatibility {...propsWithError} />);

    expect(screen.getByTestId('year-to-error')).toBeTruthy();
    expect(screen.getByText('سنة النهاية أكبر من سنة البداية')).toBeTruthy();
  });
});
