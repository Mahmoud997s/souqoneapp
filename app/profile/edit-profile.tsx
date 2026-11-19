import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors } from '../../src/constants/colors'
import { useEditProfile } from '../../src/hooks/useEditProfile'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { GlassActionSheet } from '../../src/components/ui/GlassActionSheet'
import type { ActionSheetOption } from '../../src/store/toastStore'
import { EditProfileAvatar } from '../../src/components/profile/EditProfileAvatar'
import { EditProfileForm } from '../../src/components/profile/EditProfileForm'
import { LocationPickerModal } from '../../src/components/profile/LocationPickerModal'

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets()

  const {
    displayName,
    email,
    phone,
    bio,
    focusedField,
    errors,

    displayAvatar,
    showAvatarSheet,
    loading,

    governorateId,
    governorateName,
    wilayaId,
    wilayaName,

    modalType,
    searchQuery,
    loadingLocations,
    filteredList,

    setDisplayName,
    setPhone,
    setBio,
    setFocusedField,
    setShowAvatarSheet,
    setSearchQuery,
    setModalType,

    pickFromGallery,
    pickFromCamera,
    handleDeleteAvatar,
    handlePickImage,

    openGovernoratePicker,
    openWilayaPicker,
    handleSelectGovernorate,
    handleSelectWilaya,

    handleSave,
    handleBackPress,
  } = useEditProfile()

  return (
    <View style={s.root}>
      {/* ── Fixed Navigation Bar (Back, Title, Messages, Save) ── */}
      <GlassNavBar
        appearance="home"
        title="تعديل الملف الشخصي"
        paddingTop={insets.top}
        onBackPress={handleBackPress}
        actions={[
          {
            icon: 'chatbubble-outline',
            onPress: () => router.push('/(tabs)/chat'),
            accessibilityLabel: 'الرسائل والمحادثات',
            testID: 'edit-profile-messages-btn',
          },
          {
            icon: 'checkmark-outline',
            onPress: handleSave,
            accessibilityLabel: 'حفظ التعديلات',
            testID: 'edit-profile-save-btn',
            loading: loading,
            disabled: loading,
            iconColor: Colors.primary,
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          s.content,
          {
            paddingTop: insets.top + 60,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Section ── */}
        <EditProfileAvatar
          displayAvatar={displayAvatar}
          onPress={handlePickImage}
        />

        {/* ── Form Sections (Basic, Contact, Location) ── */}
        <EditProfileForm
          displayName={displayName}
          email={email}
          phone={phone}
          bio={bio}
          focusedField={focusedField}
          onFocusField={setFocusedField}
          onBlurField={() => setFocusedField(null)}
          governorateId={governorateId}
          governorateName={governorateName}
          wilayaId={wilayaId}
          wilayaName={wilayaName}
          onDisplayNameChange={setDisplayName}
          onPhoneChange={setPhone}
          onBioChange={setBio}
          onGovernoratePress={openGovernoratePicker}
          onWilayaPress={openWilayaPicker}
          errors={errors}
        />
      </ScrollView>

        {/* ── Avatar Options Glass Bottom Sheet ── */}
        <GlassActionSheet
          visible={showAvatarSheet}
          title="الصورة الشخصية"
          testID="avatar-action-sheet"
          onClose={() => setShowAvatarSheet(false)}
          options={[
            {
              text: 'التقاط صورة',
              icon: 'camera-outline',
              onPress: pickFromCamera,
              testID: 'avatar-option-camera',
            },
            {
              text: 'اختيار من المعرض',
              icon: 'images-outline',
              onPress: pickFromGallery,
              testID: 'avatar-option-gallery',
            },
            ...(displayAvatar
              ? [
                  {
                    text: 'حذف الصورة',
                    icon: 'trash-outline',
                    style: 'destructive' as const,
                    onPress: handleDeleteAvatar,
                    testID: 'avatar-option-delete',
                  } satisfies ActionSheetOption,
                ]
              : []),
          ]}
        />

        {/* ── Location Selector Modal ── */}
        <LocationPickerModal
          visible={modalType !== null}
          modalType={modalType}
          governorateName={governorateName}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={loadingLocations}
          data={filteredList}
          selectedId={modalType === 'governorate' ? governorateId : wilayaId}
          onClose={() => setModalType(null)}
          onSelectGovernorate={handleSelectGovernorate}
          onSelectWilaya={handleSelectWilaya}
        />
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.slateSurface,
  },
  content: {
    paddingHorizontal: 16,
  },
})
