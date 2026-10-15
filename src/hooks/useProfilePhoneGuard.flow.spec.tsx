import React from 'react'
import { render, screen, act } from '@testing-library/react-native'
import { View, Text } from 'react-native'
import { useProfilePhoneGuard } from './useProfilePhoneGuard'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { usersApi } from '../api/users'
import { queryClient } from '../api/queryClient'
import { useEditProfile } from './useEditProfile'
import { ProfilePhoneGuardView } from '../components/profile/ProfilePhoneGuardView'

jest.mock('../api/auth')
jest.mock('../api/users')
jest.mock('../api/locations', () => ({
  locationsApi: {
    getGovernorates: jest.fn().mockResolvedValue([]),
    getWilayas: jest.fn().mockResolvedValue([]),
  },
}))
jest.mock('../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

let focusCallback: (() => void) | null = null

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useFocusEffect: (cb: any) => {
    focusCallback = cb
  },
}))

function TestFormScreen() {
  const { hasPhone, checking, phone } = useProfilePhoneGuard()

  if (checking) {
    return <Text testID="loading">جاري التحقق...</Text>
  }

  if (!hasPhone) {
    return <ProfilePhoneGuardView title="إضافة إعلان" />
  }

  return (
    <View testID="form-content">
      <Text testID="profile-phone-display">{phone}</Text>
      <Text>مرحباً بك في فورم الإضافة</Text>
    </View>
  )
}

describe('Profile Phone Guard & Cache Flow (Spec 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    queryClient.clear()
    focusCallback = null
  })

  it('initially displays phone guard when profile has no phone, then after saving phone and returning, guard disappears and displays new phone', async () => {
    // 1. Initial State: Profile has NO phone
    useAuthStore.setState({
      user: {
        id: 'usr-42',
        displayName: 'مستخدم تجريبي',
        phone: '',
      } as any,
      isLoggedIn: true,
      isGuest: false,
      isLoading: false,
    })

    let currentUser = {
      id: 'usr-42',
      displayName: 'مستخدم تجريبي',
      phone: '',
    }

    ;(authApi.me as jest.Mock).mockImplementation(async () => ({
      data: { user: currentUser },
    }))

    let editProfileHook: any
    function EditConsumer() {
      editProfileHook = useEditProfile()
      return null
    }

    function TestContainer() {
      return (
        <View>
          <TestFormScreen />
          <EditConsumer />
        </View>
      )
    }

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    await render(<TestContainer />)

    // Guard should be visible
    expect(screen.getByText('إضافة رقم الهاتف مطلوبة')).toBeTruthy()
    expect(screen.getByTestId('guard-add-phone-btn')).toBeTruthy()
    expect(screen.queryByTestId('form-content')).toBeNull()

    // 2. User simulates saving phone in EditProfile
    ;(usersApi.updateProfile as jest.Mock).mockImplementation(async (payload: any) => {
      currentUser = { ...currentUser, ...payload }
      return { data: currentUser }
    })

    await act(async () => {
      editProfileHook.setPhone('+96891234567')
    })

    await act(async () => {
      await editProfileHook.handleSave()
    })

    // Assert queryClient invalidated queries
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['user'] }))
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['profile'] }))

    // Assert authStore user was updated directly
    expect(useAuthStore.getState().user?.phone).toBe('+96891234567')

    // 3. User navigates back: Form Screen regains focus
    if (focusCallback) {
      await act(async () => {
        focusCallback!()
      })
    }

    // Guard should NO longer be displayed
    expect(screen.queryByText('إضافة رقم الهاتف مطلوبة')).toBeNull()
    // Form content should be visible
    expect(screen.getByTestId('form-content')).toBeTruthy()
    // Displayed profile should show the updated phone number
    expect(screen.getByTestId('profile-phone-display').props.children).toBe('+96891234567')
  })
})
