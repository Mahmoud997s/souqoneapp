import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';

import { WizardSelectField, formatWizardMultiSummary } from '../components/ui/WizardSelectField';
import { CarStep3Details } from '../components/cars/wizard/CarStep3Details';
import { CarStep4Location } from '../components/cars/wizard/CarStep4Location';
import { BusStep3Details } from '../components/buses/wizard/BusStep3Details';
import { EquipmentStep3Details } from '../components/equipment/wizard/EquipmentStep3Details';
import { OperatorEquipCertsStep } from '../components/operators/OperatorEquipCertsStep';
import { PartStep1Category } from '../components/parts/wizard/PartStep1Category';
import { PartStep4Compatibility } from '../components/parts/wizard/PartStep4Compatibility';
import { ServiceStep1Type } from '../components/services/wizard/ServiceStep1Type';
import { ServiceStep3Details } from '../components/services/wizard/ServiceStep3Details';

import { BusWizardData } from '../store/busWizardStore';
import { defaultPartFormData } from '../store/partWizardStore';
import { defaultServiceFormData } from '../store/serviceWizardStore';
import { CAR_FEATURE_KEYS } from '../constants/cars';
import { POPULAR_EQUIPMENT_FEATURES } from '../constants/equipment';
import { AVAILABLE_EQUIPMENT } from '../constants/operators';

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}));

jest.mock('expo-image', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    Image: () => <View testID="mock-expo-image" />,
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('../api/cars', () => ({
  carsApi: {
    getBrands: jest.fn().mockResolvedValue([]),
    getModels: jest.fn().mockResolvedValue([]),
    getTrims: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../api/buses', () => ({
  busesApi: {
    getManufacturers: jest.fn().mockResolvedValue([]),
    getModels: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn().mockResolvedValue([]),
    getWilayas: jest.fn().mockResolvedValue([]),
  },
}));

const ROOT = path.resolve(__dirname, '../..');
const readRepoFile = (relPath: string) =>
  fs.readFileSync(path.join(ROOT, relPath), 'utf8');

describe('D-382: Wizard option chips converted to flat WizardSelectField / multi-select lists', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('Shared WizardSelectField multiple mode', () => {
    it('stays open while toggling, uses checkbox role/state, formats 0/1/2/N summaries, and renders 0 glass views', async () => {
      const onToggle = jest.fn();
      const options = [
        { value: 'a', label: 'ألف', testID: 'opt-a' },
        { value: 'b', label: 'باء', testID: 'opt-b' },
        { value: 'c', label: 'جيم', testID: 'opt-c' },
      ];

      const { rerender } = await render(
        <WizardSelectField
          testID="multi-select"
          multiple
          values={[]}
          placeholder="اختر المميزات"
          formatMultiSummary={(n) =>
            formatWizardMultiSummary(n, 'ميزة واحدة محددة', 'ميزتان محددتان', 'مميزات محددة')
          }
          options={options}
          onToggle={onToggle}
        />
      );

      // Zero glass views in flat mode
      expect(screen.queryByTestId('multi-select-glass')).toBeNull();
      expect(screen.getByText('اختر المميزات')).toBeTruthy();

      // Open list
      await act(async () => {
        fireEvent.press(screen.getByTestId('multi-select'));
      });
      expect(screen.getByTestId('multi-select').props.accessibilityState.expanded).toBe(true);

      // Toggle option -> stays open
      const optA = screen.getByTestId('opt-a');
      expect(optA.props.accessibilityRole).toBe('checkbox');
      expect(optA.props.accessibilityState).toEqual({ checked: false });

      await act(async () => {
        fireEvent.press(optA);
      });
      expect(onToggle).toHaveBeenCalledWith('a');
      expect(screen.getByTestId('multi-select').props.accessibilityState.expanded).toBe(true);

      // Re-render with saved values (edit mode / draft resume)
      await rerender(
        <WizardSelectField
          testID="multi-select"
          multiple
          values={['a', 'b', 'c']}
          placeholder="اختر المميزات"
          formatMultiSummary={(n) =>
            formatWizardMultiSummary(n, 'ميزة واحدة محددة', 'ميزتان محددتان', 'مميزات محددة')
          }
          options={options}
          onToggle={onToggle}
        />
      );
      expect(screen.getByText('3 مميزات محددة')).toBeTruthy();
      expect(screen.getByTestId('opt-a').props.accessibilityState).toEqual({ checked: true });
      expect(screen.getByTestId('opt-b').props.accessibilityState).toEqual({ checked: true });
      expect(screen.getByTestId('opt-c').props.accessibilityState).toEqual({ checked: true });
    });
  });

  describe('Cars Step 3 & Step 4', () => {
    const baseCarFormData: any = {
      listingType: 'SALE',
      title: 'تويوتا كامري',
      description: 'سيارة نظيفة',
      make: 'Toyota',
      makeId: '1',
      model: 'Camry',
      modelId: '10',
      trim: '',
      year: '2022',
      mileage: '25000',
      condition: 'USED',
      fuelType: 'PETROL',
      bodyType: 'SEDAN',
      driveType: 'FWD',
      transmission: '',
      exteriorColor: 'WHITE',
      interior: '',
      engineSize: '2500',
      horsepower: '203',
      doors: '4',
      seats: '5',
      features: [CAR_FEATURE_KEYS[0].id, 'ميزة مخصصة'],
    };

    it('CarStep3Details: flat transmission & multi-select features with saved draft state, 0 glass views on list, and custom feature add/remove intact', async () => {
      const onUpdateField = jest.fn();
      const onToggleFeature = jest.fn();
      const onAddCustomFeature = jest.fn();
      const onRemoveFeature = jest.fn();

      await render(
        <CarStep3Details
          formData={baseCarFormData}
          errors={{}}
          customFeatureInput="تظليل حراري"
          onChangeCustomFeatureInput={jest.fn()}
          onToggleFeature={onToggleFeature}
          onAddCustomFeature={onAddCustomFeature}
          onRemoveFeature={onRemoveFeature}
          onUpdateField={onUpdateField}
        />
      );

      // Zero glass views on the flat selects
      expect(screen.queryByTestId('car-features-select-glass')).toBeNull();
      expect(screen.queryByTestId('car-transmission-select-glass')).toBeNull();

      // Saved standard feature shows in header summary (1 standard feature; custom one stays as pill)
      expect(screen.getByText('ميزة واحدة محددة')).toBeTruthy();
      expect(screen.getByText('ميزة مخصصة')).toBeTruthy();

      // Open features list -> saved feature checked, toggle another stays open
      await act(async () => {
        fireEvent.press(screen.getByTestId('car-features-select'));
      });
      expect(
        screen.getByTestId(`car-feature-${CAR_FEATURE_KEYS[0].id}`).props.accessibilityState
      ).toEqual({ checked: true });

      await act(async () => {
        fireEvent.press(screen.getByTestId(`car-feature-${CAR_FEATURE_KEYS[1].id}`));
      });
      expect(onToggleFeature).toHaveBeenCalledWith(CAR_FEATURE_KEYS[1].id);
      expect(screen.getByTestId('car-features-select').props.accessibilityState.expanded).toBe(true);

      // Custom feature input still works
      expect(screen.getByPlaceholderText('إضافة ميزة أخرى...')).toBeTruthy();

      // Transmission single-select
      await act(async () => {
        fireEvent.press(screen.getByTestId('car-transmission-select'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('car-transmission-AUTOMATIC'));
      });
      expect(onUpdateField).toHaveBeenCalledWith('transmission', 'AUTOMATIC');
    });

    it('CarStep4Location: cancellation policy uses flat single-select WizardSelectField', async () => {
      const onUpdateField = jest.fn();
      await render(
        <CarStep4Location
          formData={{
            ...baseCarFormData,
            listingType: 'RENTAL',
            cancellationPolicy: '',
            withDriver: false,
            deliveryAvailable: false,
            governorateId: null,
            wilayaId: null,
            phone: '',
            whatsappEnabled: false,
          }}
          errors={{}}
          onUpdateField={onUpdateField}
          onLocationChange={jest.fn()}
        />
      );

      expect(screen.queryByTestId('car-cancellation-policy-select-glass')).toBeNull();
      await act(async () => {
        fireEvent.press(screen.getByTestId('car-cancellation-policy-select'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('cancellation-policy-FLEXIBLE'));
      });
      expect(onUpdateField).toHaveBeenCalledWith('cancellationPolicy', 'FLEXIBLE');
    });
  });

  describe('Buses Step 3, Equipment Step 3, Operators, Parts, Services', () => {
    it('BusStep3Details: flat features multi-select preserves feature-<id>, edit resume, and 0 glass views', async () => {
      const onUpdateField = jest.fn();
      const busData: BusWizardData = {
        busListingType: 'BUS_SALE',
        busType: 'COASTER',
        make: '',
        model: '',
        manufacturerId: null,
        modelId: null,
        year: '',
        capacity: '',
        condition: 'USED',
        transmission: 'AUTOMATIC',
        fuelType: 'DIESEL',
        mileage: '',
        plateNumber: '',
        features: ['ac', 'wifi'],
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
        whatsappEnabled: false,
      };
      await render(
        <BusStep3Details
          data={busData}
          errors={{}}
          onUpdateField={onUpdateField}
        />
      );

      expect(screen.queryByTestId('bus-features-select-glass')).toBeNull();
      expect(screen.getByText('ميزتان محددتان')).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId('bus-features-select'));
      });
      expect(screen.getByTestId('feature-ac').props.accessibilityState).toEqual({ checked: true });
      await act(async () => {
        fireEvent.press(screen.getByTestId('feature-ac'));
      });
      expect(onUpdateField).toHaveBeenCalledWith('features', ['wifi']);
      expect(screen.getByTestId('bus-features-select').props.accessibilityState.expanded).toBe(true);
    });

    it('EquipmentStep3Details: flat condition & features multi-select with saved draft state, 0 glass views, and custom feature section intact', async () => {
      const onUpdateField = jest.fn();
      const onToggleFeature = jest.fn();
      const onRemoveFeature = jest.fn();

      await render(
        <EquipmentStep3Details
          formData={{
            listingType: 'EQUIPMENT_SALE',
            year: '2021',
            hoursUsed: '500',
            condition: '',
            capacity: '',
            power: '',
            weight: '',
            features: [POPULAR_EQUIPMENT_FEATURES[0], 'بوم طويل'],
          } as any}
          errors={{}}
          customFeatureInput="جاك همر"
          onChangeCustomFeatureInput={jest.fn()}
          onToggleFeature={onToggleFeature}
          onAddCustomFeature={jest.fn()}
          onRemoveFeature={onRemoveFeature}
          onUpdateField={onUpdateField}
        />
      );

      expect(screen.queryByTestId('equipment-features-select-glass')).toBeNull();
      expect(screen.queryByTestId('equipment-condition-select-glass')).toBeNull();
      expect(screen.getByText('ميزة واحدة محددة')).toBeTruthy();
      expect(screen.getByText('الميزات المحددة (2):')).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId('equipment-features-select'));
      });
      expect(
        screen.getByTestId(`equipment-feature-${POPULAR_EQUIPMENT_FEATURES[0]}`).props.accessibilityState
      ).toEqual({ checked: true });
      await act(async () => {
        fireEvent.press(screen.getByTestId(`equipment-feature-${POPULAR_EQUIPMENT_FEATURES[1]}`));
      });
      expect(onToggleFeature).toHaveBeenCalledWith(POPULAR_EQUIPMENT_FEATURES[1]);
      expect(screen.getByTestId('equipment-features-select').props.accessibilityState.expanded).toBe(true);
    });

    it('OperatorEquipCertsStep: flat equipment multi-select with saved draft state and 0 glass views', async () => {
      const onToggleEquipment = jest.fn();
      await render(
        <OperatorEquipCertsStep
          formData={{
            equipmentTypes: [AVAILABLE_EQUIPMENT[0].id, AVAILABLE_EQUIPMENT[1].id],
            certifications: [],
            specializations: [],
          } as any}
          errors={{}}
          isUploading={false}
          onToggleEquipment={onToggleEquipment}
          onPickCertificateImages={jest.fn()}
          onRemoveCertificate={jest.fn()}
          onAddTextCertificate={jest.fn()}
        />
      );

      expect(screen.queryByTestId('operator-equipment-select-glass')).toBeNull();
      expect(screen.getByText('معدتان محددتان')).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId('operator-equipment-select'));
      });
      expect(
        screen.getByTestId(`operator-equipment-${AVAILABLE_EQUIPMENT[0].id}`).props.accessibilityState
      ).toEqual({ checked: true });
      await act(async () => {
        fireEvent.press(screen.getByTestId(`operator-equipment-${AVAILABLE_EQUIPMENT[2].id}`));
      });
      expect(onToggleEquipment).toHaveBeenCalledWith(AVAILABLE_EQUIPMENT[2].id);
      expect(screen.getByTestId('operator-equipment-select').props.accessibilityState.expanded).toBe(true);
    });

    it('PartStep1Category: flat condition & originality preserve boolean saved value with 0 glass views', async () => {
      const onUpdatePart1 = jest.fn();
      await render(
        <PartStep1Category
          formData={{ ...defaultPartFormData, isOriginal: true }}
          errors={{}}
          onUpdateField={onUpdatePart1}
        />
      );
      expect(screen.queryByTestId('part-condition-select-glass')).toBeNull();
      expect(screen.queryByTestId('part-originality-select-glass')).toBeNull();

      await act(async () => {
        fireEvent.press(screen.getByTestId('part-originality-select'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('originality-false'));
      });
      expect(onUpdatePart1).toHaveBeenCalledWith('isOriginal', false);
    });

    it('PartStep4Compatibility: flat vehicle-types multi-select with 0 glass views and all-makes toggle preserved', async () => {
      const onUpdatePart4 = jest.fn();
      await render(
        <PartStep4Compatibility
          formData={{ ...defaultPartFormData, compatibleVehicleTypes: ['CAR'] }}
          errors={{}}
          onUpdateField={onUpdatePart4}
        />
      );
      expect(screen.queryByTestId('part-vehicle-types-select-glass')).toBeNull();
      expect(screen.getByText('نوع واحد محدد')).toBeTruthy();
      expect(screen.getByTestId('all-makes-chip')).toBeTruthy();
    });

    it('ServiceStep1Type: flat providerType single-select with 0 glass views', async () => {
      const onUpdate1 = jest.fn();
      await render(
        <ServiceStep1Type
          formData={defaultServiceFormData}
          errors={{}}
          onUpdateField={onUpdate1}
        />
      );
      expect(screen.queryByTestId('service-provider-type-select-glass')).toBeNull();
      await act(async () => {
        fireEvent.press(screen.getByTestId('service-provider-type-select'));
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('provider-type-WORKSHOP'));
      });
      expect(onUpdate1).toHaveBeenCalledWith('providerType', 'WORKSHOP');
    });

    it('ServiceStep3Details: flat specializations multi-select with saved draft state and 0 glass views', async () => {
      const onUpdate3 = jest.fn();
      await render(
        <ServiceStep3Details
          formData={{
            ...defaultServiceFormData,
            serviceType: 'MAINTENANCE',
            specializations: ['تغيير زيت وفلاتر'],
          }}
          errors={{}}
          onUpdateField={onUpdate3}
        />
      );
      expect(screen.queryByTestId('service-specializations-select-glass')).toBeNull();
      expect(screen.getByText('تخصص واحد محدد')).toBeTruthy();
      await act(async () => {
        fireEvent.press(screen.getByTestId('service-specializations-select'));
      });
      expect(screen.getByTestId('spec-chip-تغيير زيت وفلاتر').props.accessibilityState).toEqual({
        checked: true,
      });
      await act(async () => {
        fireEvent.press(screen.getByTestId('spec-chip-ميكانيكا عامة'));
      });
      expect(onUpdate3).toHaveBeenCalledWith('specializations', [
        'تغيير زيت وفلاتر',
        'ميكانيكا عامة',
      ]);
      expect(screen.getByTestId('service-specializations-select').props.accessibilityState.expanded).toBe(true);
    });
  });

  describe('Glass count reduction guard across converted wizard files', () => {
    it('removes all WizardOptionChip usages from the 8 fully converted wizard files', () => {
      const fullyConverted = [
        'src/components/cars/wizard/CarStep3Details.tsx',
        'src/components/cars/wizard/CarStep4Location.tsx',
        'src/components/buses/wizard/BusStep3Details.tsx',
        'src/components/equipment/wizard/EquipmentStep3Details.tsx',
        'src/components/operators/OperatorEquipCertsStep.tsx',
        'src/components/parts/wizard/PartStep1Category.tsx',
        'src/components/services/wizard/ServiceStep1Type.tsx',
        'src/components/services/wizard/ServiceStep3Details.tsx',
      ];
      for (const file of fullyConverted) {
        expect(readRepoFile(file)).not.toContain('WizardOptionChip');
      }

      // PartStep4Compatibility keeps only the single all-makes boolean toggle chip
      const part4Matches = readRepoFile('src/components/parts/wizard/PartStep4Compatibility.tsx').match(
        /<WizardOptionChip\b/g
      );
      expect(part4Matches?.length).toBe(1);
    });
  });
});
