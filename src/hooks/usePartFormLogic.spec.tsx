import React from 'react'
import { View, TouchableOpacity, Linking } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { usePartFormLogic } from './usePartFormLogic'
import { defaultPartFormData, PartFormData } from '../store/partWizardStore'
import * as ImagePicker from 'expo-image-picker'
import { dialogService } from '../store/dialogStore'

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  },
}))

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}))

jest.mock('../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

function TestComponent({
  formData,
  setField,
  setLocation,
}: {
  formData: PartFormData
  setField: any
  setLocation: any
}) {
  const logic = usePartFormLogic(formData, setField, setLocation)
  return (
    <View>
      <TouchableOpacity testID="btn-pick" onPress={logic.handlePickImages} />
      <TouchableOpacity
        testID="btn-remove-new"
        onPress={() => logic.handleRemoveNewImage(1)}
      />
      <TouchableOpacity
        testID="btn-remove-exist"
        onPress={() => logic.handleRemoveExistingImage('img-101')}
      />
      <TouchableOpacity
        testID="btn-primary-new"
        onPress={() => logic.handleMakePrimaryNew(2)}
      />
      <TouchableOpacity
        testID="btn-primary-exist"
        onPress={() => logic.handleMakePrimaryExisting(1)}
      />
      <TouchableOpacity
        testID="btn-location"
        onPress={() => logic.handleLocationChange(1, 10, 'مسقط', 'السيب')}
      />
    </View>
  )
}

describe('usePartFormLogic Hook', () => {
  let mockSetField: jest.Mock
  let mockSetLocation: jest.Mock
  let testFormData: PartFormData
  let openSettingsSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockSetField = jest.fn()
    mockSetLocation = jest.fn()
    testFormData = { ...defaultPartFormData }
    if (!Linking.openSettings) {
      ;(Linking as any).openSettings = jest.fn()
    }
    openSettingsSpy = jest
      .spyOn(Linking, 'openSettings')
      .mockImplementation(() => Promise.resolve() as any)
  })

  afterEach(() => {
    openSettingsSpy.mockRestore()
  })

  it('handles image picking with permission granted', async () => {
    ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    })
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://new-part-1.jpg' }, { uri: 'file://new-part-2.jpg' }],
    })

    await render(
      <TestComponent
        formData={testFormData}
        setField={mockSetField}
        setLocation={mockSetLocation}
      />
    )

    await fireEvent.press(screen.getByTestId('btn-pick'))

    expect(mockSetField).toHaveBeenCalledWith('images', [
      { uri: 'file://new-part-1.jpg', isPrimary: false },
      { uri: 'file://new-part-2.jpg', isPrimary: false },
    ])
    expect(dialogService.alert).not.toHaveBeenCalled()
    expect(dialogService.confirm).not.toHaveBeenCalled()
  })

  it('handles image picking when accessPrivileges is limited (iOS)', async () => {
    ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: true,
      accessPrivileges: 'limited',
    })
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://limited-part.jpg' }],
    })

    await render(
      <TestComponent
        formData={testFormData}
        setField={mockSetField}
        setLocation={mockSetLocation}
      />
    )

    await fireEvent.press(screen.getByTestId('btn-pick'))

    expect(mockSetField).toHaveBeenCalledWith('images', [
      { uri: 'file://limited-part.jpg', isPrimary: false },
    ])
    expect(dialogService.alert).not.toHaveBeenCalled()
    expect(dialogService.confirm).not.toHaveBeenCalled()
  })

  it('shows plain alert without settings button when permission is denied and canAskAgain=true', async () => {
    ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: true,
    })

    await render(
      <TestComponent
        formData={testFormData}
        setField={mockSetField}
        setLocation={mockSetLocation}
      />
    )

    await fireEvent.press(screen.getByTestId('btn-pick'))

    expect(dialogService.alert).toHaveBeenCalledWith(
      'إذن الوصول مطلوب',
      'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور القطعة'
    )
    expect(dialogService.confirm).not.toHaveBeenCalled()
    expect(mockSetField).not.toHaveBeenCalled()
  })

  it('shows settings confirm dialog when permission is denied and canAskAgain=false', async () => {
    ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    })

    await render(
      <TestComponent
        formData={testFormData}
        setField={mockSetField}
        setLocation={mockSetLocation}
      />
    )

    await fireEvent.press(screen.getByTestId('btn-pick'))

    expect(dialogService.alert).not.toHaveBeenCalled()
    expect(dialogService.confirm).toHaveBeenCalledTimes(1)

    const [title, message, onConfirm, confirmText, cancelText] = (
      dialogService.confirm as jest.Mock
    ).mock.calls[0]

    expect(title).toBe('إذن الوصول مطلوب')
    expect(message).toBe(
      'يرجى السماح بالوصول لمعرض الصور من إعدادات الهاتف لتتمكن من إرفاق صور القطعة'
    )
    expect(confirmText).toBe('فتح الإعدادات')
    expect(cancelText).toBe('إلغاء')

    expect(openSettingsSpy).not.toHaveBeenCalled()
    onConfirm()
    expect(openSettingsSpy).toHaveBeenCalledTimes(1)
    expect(mockSetField).not.toHaveBeenCalled()
  })

  it('safely handles unexpected exception during permission request without crashing', async () => {
    ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockRejectedValue(
      new Error('Native permissions module error')
    )

    await render(
      <TestComponent
        formData={testFormData}
        setField={mockSetField}
        setLocation={mockSetLocation}
      />
    )

    await fireEvent.press(screen.getByTestId('btn-pick'))

    expect(dialogService.alert).toHaveBeenCalledWith(
      'إذن الوصول مطلوب',
      'يرجى السماح بالوصول لمعرض الصور لتتمكن من إرفاق صور القطعة'
    )
    expect(mockSetField).not.toHaveBeenCalled()
  })

  it('removes new image by index', async () => {
    const formDataWithImages: PartFormData = {
      ...defaultPartFormData,
      images: [
        { uri: 'file://img1.jpg' },
        { uri: 'file://img2.jpg' },
        { uri: 'file://img3.jpg' },
      ],
    }

    await render(
      <TestComponent
        formData={formDataWithImages}
        setField={mockSetField}
        setLocation={mockSetLocation}
      />
    )

    fireEvent.press(screen.getByTestId('btn-remove-new'))

    expect(mockSetField).toHaveBeenCalledWith('images', [
      { uri: 'file://img1.jpg' },
      { uri: 'file://img3.jpg' },
    ])
  })

  it('removes existing image and tracks removed ID', async () => {
    const formDataWithExisting: PartFormData = {
      ...defaultPartFormData,
      existingImages: [
        { id: 'img-101', url: 'https://cdn.example.com/p1.jpg' },
        { id: 'img-102', url: 'https://cdn.example.com/p2.jpg' },
      ],
      removedImageIds: [],
    }

    await render(
      <TestComponent
        formData={formDataWithExisting}
        setField={mockSetField}
        setLocation={mockSetLocation}
      />
    )

    fireEvent.press(screen.getByTestId('btn-remove-exist'))

    expect(mockSetField).toHaveBeenCalledWith('existingImages', [
      { id: 'img-102', url: 'https://cdn.example.com/p2.jpg' },
    ])
    expect(mockSetField).toHaveBeenCalledWith('removedImageIds', ['img-101'])
  })

  it('makes selected new image primary (moves to index 0)', async () => {
    const formDataWithImages: PartFormData = {
      ...defaultPartFormData,
      images: [
        { uri: 'file://img1.jpg' },
        { uri: 'file://img2.jpg' },
        { uri: 'file://img3.jpg' },
      ],
    }

    await render(
      <TestComponent
        formData={formDataWithImages}
        setField={mockSetField}
        setLocation={mockSetLocation}
      />
    )

    fireEvent.press(screen.getByTestId('btn-primary-new'))

    expect(mockSetField).toHaveBeenCalledWith('images', [
      { uri: 'file://img3.jpg' },
      { uri: 'file://img1.jpg' },
      { uri: 'file://img2.jpg' },
    ])
  })

  it('makes selected existing image primary (moves to index 0)', async () => {
    const formDataWithExisting: PartFormData = {
      ...defaultPartFormData,
      existingImages: [
        { id: '1', url: 'https://cdn/1.jpg' },
        { id: '2', url: 'https://cdn/2.jpg' },
      ],
    }

    await render(
      <TestComponent
        formData={formDataWithExisting}
        setField={mockSetField}
        setLocation={mockSetLocation}
      />
    )

    fireEvent.press(screen.getByTestId('btn-primary-exist'))

    expect(mockSetField).toHaveBeenCalledWith('existingImages', [
      { id: '2', url: 'https://cdn/2.jpg' },
      { id: '1', url: 'https://cdn/1.jpg' },
    ])
  })

  it('delegates location updates to setLocation', async () => {
    await render(
      <TestComponent
        formData={testFormData}
        setField={mockSetField}
        setLocation={mockSetLocation}
      />
    )

    fireEvent.press(screen.getByTestId('btn-location'))

    expect(mockSetLocation).toHaveBeenCalledWith(1, 10, 'مسقط', 'السيب')
  })
})
