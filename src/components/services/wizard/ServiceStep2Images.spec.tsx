import React from 'react'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native'
import { ServiceStep2Images } from './ServiceStep2Images'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-image', () => ({
  Image: 'Image',
}))

describe('ServiceStep2Images', () => {
  const mockOnPickImages = jest.fn()
  const mockOnRemoveNewImage = jest.fn()
  const mockOnRemoveExistingImage = jest.fn()
  const mockOnMakePrimaryNew = jest.fn()
  const mockOnMakePrimaryExisting = jest.fn()

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
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders upload box and fires onPickImages when clicked', async () => {
    await render(<ServiceStep2Images {...defaultProps} />)

    const uploadBox = screen.getByTestId('upload-box')
    expect(uploadBox).toBeTruthy()
    expect(screen.getByText('مطلوب')).toBeTruthy()

    await act(async () => {
      fireEvent.press(uploadBox)
    })
    expect(mockOnPickImages).toHaveBeenCalledTimes(1)
  })

  it('renders existing images and handles remove and make primary actions', async () => {
    const props = {
      ...defaultProps,
      existingImages: [
        { id: 'img-1', url: 'https://test.com/1.jpg', isPrimary: true },
        { id: 'img-2', url: 'https://test.com/2.jpg', isPrimary: false },
      ],
    }

    await render(<ServiceStep2Images {...props} />)

    expect(screen.getByText('الصور الحالية المرفوعة (2)')).toBeTruthy()
    expect(screen.getByText('الرئيسية')).toBeTruthy()

    const makePrimaryBtn = screen.getByTestId('make-primary-existing-1')
    expect(makePrimaryBtn).toBeTruthy()
    await act(async () => {
      fireEvent.press(makePrimaryBtn)
    })
    expect(mockOnMakePrimaryExisting).toHaveBeenCalledWith(1)

    const removeBtn = screen.getByTestId('remove-existing-image-0')
    expect(removeBtn).toBeTruthy()
    await act(async () => {
      fireEvent.press(removeBtn)
    })
    expect(mockOnRemoveExistingImage).toHaveBeenCalledWith('img-1')
  })

  it('renders new images and handles remove and make primary actions', async () => {
    const props = {
      ...defaultProps,
      images: [
        { uri: 'file://new1.jpg', isPrimary: true },
        { uri: 'file://new2.jpg', isPrimary: false },
      ],
    }

    await render(<ServiceStep2Images {...props} />)

    expect(screen.getByText('الصور الجديدة المضافة (2)')).toBeTruthy()

    const makePrimaryBtn = screen.getByTestId('make-primary-new-1')
    expect(makePrimaryBtn).toBeTruthy()
    await act(async () => {
      fireEvent.press(makePrimaryBtn)
    })
    expect(mockOnMakePrimaryNew).toHaveBeenCalledWith(1)

    const removeBtn = screen.getByTestId('remove-new-image-0')
    expect(removeBtn).toBeTruthy()
    await act(async () => {
      fireEvent.press(removeBtn)
    })
    expect(mockOnRemoveNewImage).toHaveBeenCalledWith(0)
  })

  it('displays inline error message when errors.images is provided', async () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        images: 'أضف صورة واحدة على الأقل',
      },
    }

    await render(<ServiceStep2Images {...propsWithErrors} />)

    expect(screen.getByText('أضف صورة واحدة على الأقل')).toBeTruthy()
  })
})
