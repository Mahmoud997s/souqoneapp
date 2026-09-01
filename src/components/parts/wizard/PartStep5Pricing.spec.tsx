import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import { PartStep5Pricing } from './PartStep5Pricing';
import { defaultPartFormData } from '../../../store/partWizardStore';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

jest.mock('../../ui/GovernorateWilayaSelect', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    GovernorateWilayaSelect: ({ onLocationChange }: any) => (
      <TouchableOpacity
        testID="mock-gov-wilaya-select"
        onPress={() => onLocationChange(1, 10, 'مسقط', 'السيب')}
      >
        <Text>Mock Location Selector</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('../../ui/MapLocationPicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MapLocationPicker: () => <View testID="mock-map-picker" />,
  };
});

describe('PartStep5Pricing', () => {
  const mockOnUpdateField = jest.fn();
  const mockOnLocationChange = jest.fn();

  const defaultProps = {
    formData: defaultPartFormData,
    errors: {},
    onUpdateField: mockOnUpdateField,
    onLocationChange: mockOnLocationChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('updates price as number when entering text', async () => {
    await render(<PartStep5Pricing {...defaultProps} />);

    const priceInput = screen.getByTestId('price-input');
    await act(async () => {
      fireEvent.changeText(priceInput, '150');
    });

    expect(mockOnUpdateField).toHaveBeenCalledWith('price', 150);
  });

  it('sets price to null when clearing text', async () => {
    await render(<PartStep5Pricing {...defaultProps} />);

    const priceInput = screen.getByTestId('price-input');
    await act(async () => {
      fireEvent.changeText(priceInput, '');
    });

    expect(mockOnUpdateField).toHaveBeenCalledWith('price', null);
  });

  it('toggles isPriceNegotiable switch correctly', async () => {
    await render(<PartStep5Pricing {...defaultProps} />);

    const switchComponent = screen.getByTestId('price-negotiable-switch');
    await act(async () => {
      fireEvent(switchComponent, 'valueChange', true);
    });

    expect(mockOnUpdateField).toHaveBeenCalledWith('isPriceNegotiable', true);
  });

  it('triggers onLocationChange when GovernorateWilayaSelect invokes callback', async () => {
    await render(<PartStep5Pricing {...defaultProps} />);

    const locationSelector = screen.getByTestId('mock-gov-wilaya-select');
    await act(async () => {
      fireEvent.press(locationSelector);
    });

    expect(mockOnLocationChange).toHaveBeenCalledWith(1, 10, 'مسقط', 'السيب');
  });

  it('shows mapTriggerBtn when coordinates are not set and opens map modal', async () => {
    await render(<PartStep5Pricing {...defaultProps} />);

    const mapBtn = screen.getByTestId('open-map-picker-btn');
    expect(mapBtn).toBeTruthy();
    expect(screen.queryByTestId('coords-box')).toBeNull();
  });

  it('shows coordsBox when coordinates are set and allows clearing them', async () => {
    const propsWithCoords = {
      ...defaultProps,
      formData: {
        ...defaultPartFormData,
        latitude: 23.588,
        longitude: 58.3829,
      },
    };

    await render(<PartStep5Pricing {...propsWithCoords} />);

    expect(screen.getByTestId('coords-box')).toBeTruthy();
    expect(screen.getByText(/23.5880, 58.3829/)).toBeTruthy();

    const clearBtn = screen.getByTestId('clear-map-coords-btn');
    await act(async () => {
      fireEvent.press(clearBtn);
    });

    expect(mockOnUpdateField).toHaveBeenCalledWith('latitude', null);
    expect(mockOnUpdateField).toHaveBeenCalledWith('longitude', null);
  });

  it('updates contactPhone and whatsapp correctly', async () => {
    await render(<PartStep5Pricing {...defaultProps} />);

    const phoneInput = screen.getByTestId('contact-phone-input');
    await act(async () => {
      fireEvent.changeText(phoneInput, '91234567');
    });
    expect(mockOnUpdateField).toHaveBeenCalledWith('contactPhone', '91234567');

    const whatsappInput = screen.getByTestId('whatsapp-input');
    await act(async () => {
      fireEvent.changeText(whatsappInput, '99887766');
    });
    expect(mockOnUpdateField).toHaveBeenCalledWith('whatsapp', '99887766');
  });
});
