import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('../../ui/GovernorateWilayaSelect', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    GovernorateWilayaSelect: ({ onLocationChange, govLabelText }: any) => (
      <TouchableOpacity
        testID="gov-wilaya-select"
        onPress={() => onLocationChange(1, 101, 'مسقط', 'السيب')}
      >
        <Text>{govLabelText}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('../../ui/MapLocationPicker', () => ({
  MapLocationPicker: () => null,
}));

jest.mock('../../ui/InlineError', () => ({
  InlineError: () => null,
}));

import { TransportStep2Location } from './TransportStep2Location';
import { useTransportWizardStore } from '../../../store/transportWizardStore';

describe('TransportStep2Location', () => {
  beforeEach(() => {
    useTransportWizardStore.getState().reset();
  });

  it('renders GovernorateWilayaSelect for both from and to sections (not LocationPicker)', async () => {
    await render(<TransportStep2Location />);

    expect(screen.getAllByTestId('gov-wilaya-select')).toHaveLength(2);
    expect(screen.queryByTestId('location-picker')).toBeNull();
  });

  it('calls setFromLocation with the correct args when the "from" select changes', async () => {
    await render(<TransportStep2Location />);

    const [fromSelect] = screen.getAllByTestId('gov-wilaya-select');
    await fireEvent.press(fromSelect);

    const { data } = useTransportWizardStore.getState();
    expect(data.fromGovernorateId).toBe(1);
    expect(data.fromWilayaId).toBe(101);
    expect(data.fromGovernorateNameAr).toBe('مسقط');
    expect(data.fromWilayaNameAr).toBe('السيب');
    // "to" fields must remain untouched by the "from" select
    expect(data.toGovernorateId).toBeNull();
  });

  it('calls setToLocation with the correct args when the "to" select changes', async () => {
    await render(<TransportStep2Location />);

    const [, toSelect] = screen.getAllByTestId('gov-wilaya-select');
    await fireEvent.press(toSelect);

    const { data } = useTransportWizardStore.getState();
    expect(data.toGovernorateId).toBe(1);
    expect(data.toWilayaId).toBe(101);
    expect(data.toGovernorateNameAr).toBe('مسقط');
    expect(data.toWilayaNameAr).toBe('السيب');
    // "from" fields must remain untouched by the "to" select
    expect(data.fromGovernorateId).toBeNull();
  });
});
