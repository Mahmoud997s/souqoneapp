import React from 'react'
import { View, Text, TextInput, ActivityIndicator } from 'react-native'
import TestRenderer, { act } from 'react-test-renderer'

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

import { GlassNavBar } from '../components/ui/GlassNavBar'
import { ProfilePhoneInput } from '../components/profile/ProfilePhoneInput'
import { EditProfileForm } from '../components/profile/EditProfileForm'

describe('Profile Edit UI Enhancements (Spec 086)', () => {
  /* ─────────────────────────────────────────────────────────────
   * 1. GlassNavBar Action Buttons (Save & Messages)
   * ───────────────────────────────────────────────────────────── */
  describe('GlassNavBar Save & Messages Action Buttons', () => {
    it('renders Save button and Messages button with correct testIDs and handles clicks', () => {
      const handleBack = jest.fn()
      const handleMessages = jest.fn()
      const handleSave = jest.fn()

      let tree: TestRenderer.ReactTestRenderer
      act(() => {
        tree = TestRenderer.create(
          <GlassNavBar
            title="تعديل الملف الشخصي"
            paddingTop={44}
            onBackPress={handleBack}
            actions={[
              {
                icon: 'chatbubble-outline',
                onPress: handleMessages,
                accessibilityLabel: 'الرسائل والمحادثات',
                testID: 'edit-profile-messages-btn',
              },
              {
                icon: 'checkmark-outline',
                onPress: handleSave,
                accessibilityLabel: 'حفظ التعديلات',
                testID: 'edit-profile-save-btn',
                loading: false,
                disabled: false,
              },
            ]}
          />
        )
      })

      const messagesBtn = tree!.root.findByProps({ testID: 'edit-profile-messages-btn' })
      const saveBtn = tree!.root.findByProps({ testID: 'edit-profile-save-btn' })

      expect(messagesBtn).toBeTruthy()
      expect(saveBtn).toBeTruthy()

      // Trigger actions
      act(() => {
        messagesBtn.props.onPress()
      })
      expect(handleMessages).toHaveBeenCalledTimes(1)

      act(() => {
        saveBtn.props.onPress()
      })
      expect(handleSave).toHaveBeenCalledTimes(1)
    })

    it('disables Save button and renders ActivityIndicator when loading', () => {
      const handleSave = jest.fn()

      let tree: TestRenderer.ReactTestRenderer
      act(() => {
        tree = TestRenderer.create(
          <GlassNavBar
            title="تعديل الملف الشخصي"
            paddingTop={44}
            onBackPress={jest.fn()}
            actions={[
              {
                icon: 'checkmark-outline',
                onPress: handleSave,
                accessibilityLabel: 'حفظ التعديلات',
                testID: 'edit-profile-save-btn',
                loading: true,
                disabled: true,
              },
            ]}
          />
        )
      })

      const saveBtn = tree!.root.findByProps({ testID: 'edit-profile-save-btn' })
      expect(saveBtn.props.disabled).toBe(true)

      // Find ActivityIndicator inside the button
      const spinner = saveBtn.findByType(ActivityIndicator)
      expect(spinner).toBeTruthy()
    })
  })

  /* ─────────────────────────────────────────────────────────────
   * 2. ProfilePhoneInput: Vertical Centering and RTL Explanatory Text
   * ───────────────────────────────────────────────────────────── */
  describe('ProfilePhoneInput Vertical Centering & RTL Hint', () => {
    it('renders phone input with LTR digits and vertical centering', () => {
      const onChange = jest.fn()
      let tree: TestRenderer.ReactTestRenderer
      act(() => {
        tree = TestRenderer.create(
          <ProfilePhoneInput
            value="91234567"
            onChangeText={onChange}
            testID="edit-profile-phone-input"
          />
        )
      })

      const input = tree!.root.findByType(TextInput)
      expect(input.props.textAlignVertical).toBe('center')
      expect(input.props.keyboardType).toBe('phone-pad')

      // Flatten styles to verify properties
      const style = Array.isArray(input.props.style)
        ? Object.assign({}, ...input.props.style)
        : input.props.style

      expect(style.writingDirection).toBe('ltr')
      expect(style.textAlign).toBe('left')
      expect(style.textAlignVertical).toBe('center')
    })

    it('renders explanatory hint with natural RTL start alignment and full width', () => {
      let tree: TestRenderer.ReactTestRenderer
      act(() => {
        tree = TestRenderer.create(
          <ProfilePhoneInput
            value=""
            onChangeText={jest.fn()}
          />
        )
      })

      const hint = tree!.root.findByProps({ children: 'رقمك بيظهر للمشتري عند الاتصال أو الواتساب فقط' })
      expect(hint).toBeTruthy()

      const style = Array.isArray(hint.props.style)
        ? Object.assign({}, ...hint.props.style)
        : hint.props.style

      expect(style.textAlign).toBe('left')
      expect(style.alignSelf).toBe('stretch')
    })

    it('renders error message with natural RTL start alignment and full width', () => {
      let tree: TestRenderer.ReactTestRenderer
      act(() => {
        tree = TestRenderer.create(
          <ProfilePhoneInput
            value=""
            onChangeText={jest.fn()}
            error="رقم عماني غير صحيح"
          />
        )
      })

      const error = tree!.root.findByProps({ testID: 'edit-profile-phone-error' })
      expect(error).toBeTruthy()

      const style = Array.isArray(error.props.style)
        ? Object.assign({}, ...error.props.style)
        : error.props.style

      expect(style.textAlign).toBe('left')
      expect(style.alignSelf).toBe('stretch')
    })
  })

  /* ─────────────────────────────────────────────────────────────
   * 3. EditProfileForm: Vertical Centering on all inputs
   * ───────────────────────────────────────────────────────────── */
  describe('EditProfileForm Vertical Centering', () => {
    it('applies vertical centering on single-line inputs and top alignment on multiline bio', () => {
      let tree: TestRenderer.ReactTestRenderer
      act(() => {
        tree = TestRenderer.create(
          <EditProfileForm
            displayName="محمود أحمد"
            email="mahmoud@souqone.om"
            phone="91234567"
            bio="نبذة عن المستخدم"
            focusedField={null}
            onFocusField={jest.fn()}
            onBlurField={jest.fn()}
            governorateId={1}
            governorateName="مسقط"
            wilayaId={10}
            wilayaName="السيب"
            onDisplayNameChange={jest.fn()}
            onPhoneChange={jest.fn()}
            onBioChange={jest.fn()}
            onGovernoratePress={jest.fn()}
            onWilayaPress={jest.fn()}
          />
        )
      })

      const nameInput = tree!.root.findByProps({ testID: 'edit-profile-display-name-input' })
      expect(nameInput.props.textAlignVertical).toBe('center')

      const emailInput = tree!.root.findByProps({ testID: 'edit-profile-email-input' })
      expect(emailInput.props.textAlignVertical).toBe('center')

      const bioInput = tree!.root.findByProps({ testID: 'edit-profile-bio-input' })
      expect(bioInput.props.textAlignVertical).toBe('top')
      expect(bioInput.props.multiline).toBe(true)
    })
  })
})
