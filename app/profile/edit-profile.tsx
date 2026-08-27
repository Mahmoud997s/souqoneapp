import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Colors } from '../../src/constants/colors'
import { useEditProfile } from '../../src/hooks/useEditProfile'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
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

    avatarUrl,
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
    setAvatarUrl,
    setShowAvatarSheet,
    setSearchQuery,
    setModalType,

    pickFromGallery,
    pickFromCamera,
    handlePickImage,

    openGovernoratePicker,
    openWilayaPicker,
    handleSelectGovernorate,
    handleSelectWilaya,

    handleSave,
    handleBackPress,
  } = useEditProfile()

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={s.root}>
        {/* ── Fixed Navigation Bar ── */}
        <GlassNavBar
          title="تعديل الملف الشخصي"
          paddingTop={insets.top}
          onBackPress={handleBackPress}
          actions={[
            { icon: 'chatbubble-outline', onPress: () => router.push('/(tabs)/chat' as any), accessibilityLabel: 'الرسائل' },
            { icon: 'notifications-outline', onPress: () => router.push('/profile/notifications' as any), accessibilityLabel: 'الإشعارات' },
          ]}
        />

        <ScrollView
          contentContainerStyle={[
            s.content,
            {
              paddingTop: insets.top + 66,
              paddingBottom: Math.max(insets.bottom, 16) + 21,
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
          />

          {/* ── Save Changes Button ── */}
          <View style={s.saveWrap}>
            <TouchableOpacity
              style={[s.saveBtn, loading && s.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" style={{ marginEnd: 8 }} />
                  <Text style={s.saveTxt}>حفظ التعديلات</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Avatar Options Bottom Sheet ── */}
        <Modal
          visible={showAvatarSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAvatarSheet(false)}
        >
          <View style={s.modalOverlay}>
            {/* Top area touchable to dismiss */}
            <TouchableOpacity
              style={s.modalBackdropTop}
              activeOpacity={1}
              onPress={() => setShowAvatarSheet(false)}
            />

            <View style={[s.avatarSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={s.handleBar} />

              <View style={s.avatarSheetHeader}>
                <View style={s.avatarSheetPreview}>
                  {displayAvatar ? (
                    <Image source={{ uri: displayAvatar }} style={s.avatarSheetImg} contentFit="cover" />
                  ) : (
                    <LinearGradient
                      colors={['#1e3a6e', '#0f2952', '#0B2447']}
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.avatarSheetImg}
                    >
                      <Ionicons name="person" size={22} color="rgba(255,255,255,0.85)" />
                    </LinearGradient>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.avatarSheetTitle}>الصورة الشخصية</Text>
                  <Text style={s.avatarSheetSub}>اختر الإجراء الذي تريد تنفيذه</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAvatarSheet(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={s.modalCloseBtn}
                >
                  <Ionicons name="close-circle" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={s.avatarSheetOptions}>
                <TouchableOpacity style={s.avatarOption} activeOpacity={0.7} onPress={pickFromCamera}>
                  <View style={[s.avatarOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="camera" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.avatarOptionTitle}>التقاط صورة</Text>
                    <Text style={s.avatarOptionSub}>افتح الكاميرا والتقط صورة جديدة</Text>
                  </View>
                  <Ionicons name="chevron-back" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                <View style={s.optionDivider} />

                <TouchableOpacity style={s.avatarOption} activeOpacity={0.7} onPress={pickFromGallery}>
                  <View style={[s.avatarOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="images" size={20} color="#16A34A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.avatarOptionTitle}>اختيار من المعرض</Text>
                    <Text style={s.avatarOptionSub}>اختر صورة من ألبوم الصور</Text>
                  </View>
                  <Ionicons name="chevron-back" size={16} color="#CBD5E1" />
                </TouchableOpacity>

                {displayAvatar ? (
                  <>
                    <View style={s.optionDivider} />
                    <TouchableOpacity
                      style={s.avatarOption}
                      activeOpacity={0.7}
                      onPress={() => { setAvatarUrl(''); setShowAvatarSheet(false) }}
                    >
                      <View style={[s.avatarOptionIcon, { backgroundColor: '#FFF1F2' }]}>
                        <Ionicons name="trash-outline" size={20} color="#E11D48" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.avatarOptionTitle, { color: '#E11D48' }]}>حذف الصورة</Text>
                        <Text style={s.avatarOptionSub}>إزالة الصورة الشخصية الحالية</Text>
                      </View>
                      <Ionicons name="chevron-back" size={16} color="#CBD5E1" />
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Location Picker Modal ── */}
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
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /* Save Button */
  saveWrap: {
    marginTop: 6,
    marginBottom: 10,
  },
  saveBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  /* Bottom Sheet Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdropTop: {
    flex: 1,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalCloseBtn: {
    padding: 4,
  },

  /* Avatar Options Bottom Sheet */
  avatarSheet: {
    backgroundColor: '#FFFFFF',
    borderTopStartRadius: 22,
    borderTopEndRadius: 22,
  },
  avatarSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarSheetPreview: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  avatarSheetImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSheetTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: 21,
    color: '#1E293B',
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  avatarSheetSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#94A3B8',
    writingDirection: 'rtl',
    textAlign: 'left',
    marginTop: 2,
  },
  avatarSheetOptions: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },
  avatarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  avatarOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#1E293B',
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  avatarOptionSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#94A3B8',
    writingDirection: 'rtl',
    textAlign: 'left',
    marginTop: 1,
  },
})
