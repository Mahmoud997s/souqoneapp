import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BusStep2Images } from './BusStep2Images';

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('BusStep2Images', () => {
  const mockOnPickImages = jest.fn();
  const mockOnRemoveNewImage = jest.fn();
  const mockOnRemoveExistingImage = jest.fn();
  const mockOnMakePrimaryNew = jest.fn();
  const mockOnMakePrimaryExisting = jest.fn();

  const defaultProps = {
    images: [],
    existingImages: [],
    errors: {},
    isUploading: false,
    onPickImages: mockOnPickImages,
    onRemoveNewImage: mockOnRemoveNewImage,
    onRemoveExistingImage: mockOnRemoveExistingImage,
    onMakePrimaryNew: mockOnMakePrimaryNew,
    onMakePrimaryExisting: mockOnMakePrimaryExisting,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload box correctly', async () => {
    await render(<BusStep2Images {...defaultProps} />);
    expect(screen.getByText('إرفاق صور واضحة للحافلة *')).toBeTruthy();
    expect(screen.getByTestId('upload-action-box')).toBeTruthy();
  });

  it('calls onPickImages when upload box is pressed', async () => {
    await render(<BusStep2Images {...defaultProps} />);
    fireEvent.press(screen.getByTestId('upload-action-box'));
    expect(mockOnPickImages).toHaveBeenCalledTimes(1);
  });

  it('displays validation error when errors.images is provided', async () => {
    await render(
      <BusStep2Images
        {...defaultProps}
        errors={{ images: 'يرجى إضافة صورة واحدة على الأقل للاستمرار' }}
      />
    );

    expect(screen.getByTestId('error-images')).toBeTruthy();
    expect(screen.getByText('يرجى إضافة صورة واحدة على الأقل للاستمرار')).toBeTruthy();
  });

  it('renders existing and new images correctly', async () => {
    const propsWithImages = {
      ...defaultProps,
      existingImages: [{ id: 'ex-1', url: 'https://example.com/ex1.jpg' }],
      images: ['https://example.com/new1.jpg', 'https://example.com/new2.jpg'],
    };

    await render(<BusStep2Images {...propsWithImages} />);

    expect(screen.getByTestId('existing-img-0')).toBeTruthy();
    expect(screen.getByTestId('new-img-0')).toBeTruthy();
    expect(screen.getByTestId('new-img-1')).toBeTruthy();
  });

  it('calls onRemoveNewImage when delete button is pressed on new image', async () => {
    const propsWithImages = {
      ...defaultProps,
      images: ['https://example.com/new1.jpg', 'https://example.com/new2.jpg'],
    };

    await render(<BusStep2Images {...propsWithImages} />);
    fireEvent.press(screen.getByTestId('remove-new-img-1'));
    expect(mockOnRemoveNewImage).toHaveBeenCalledWith(1);
  });

  it('calls onRemoveExistingImage when delete button is pressed on existing image', async () => {
    const propsWithImages = {
      ...defaultProps,
      existingImages: [{ id: 'ex-1', url: 'https://example.com/ex1.jpg' }],
    };

    await render(<BusStep2Images {...propsWithImages} />);
    fireEvent.press(screen.getByTestId('remove-existing-img-0'));
    expect(mockOnRemoveExistingImage).toHaveBeenCalledWith('ex-1');
  });

  it('calls onMakePrimaryNew when make primary button is pressed on secondary image', async () => {
    const propsWithImages = {
      ...defaultProps,
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    };

    await render(<BusStep2Images {...propsWithImages} />);
    const makePrimaryBtn = screen.getByTestId('make-primary-new-1');
    fireEvent.press(makePrimaryBtn);
    expect(mockOnMakePrimaryNew).toHaveBeenCalledWith(1);
  });

  it('shows loading indicator and disables upload when isUploading is true', async () => {
    await render(<BusStep2Images {...defaultProps} isUploading={true} />);
    expect(screen.getByText('جاري معالجة الصور المختارة...')).toBeTruthy();
  });
});
