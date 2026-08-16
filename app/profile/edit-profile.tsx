import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  I18nManager,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { usersApi } from '../../src/api/users'
import { uploadsApi } from '../../src/api/uploads'
import { locationsApi } from '../../src/api/locations'
import { GovernorateRef, WilayaRef } from '../../src/types/location.types'
import { Config } from '../../src/constants/config'
import { dialogService } from '../../src/store/dialogStore'

function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim()
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')

  // Focus states
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Location IDs & Display Names
  const [governorateId, setGovernorateId] = useState<number | null>(null)
  const [governorateName, setGovernorateName] = useState('')
  const [wilayaId, setWilayaId] = useState<number | null>(null)
  const [wilayaName, setWilayaName] = useState('')

  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)

  // Location Selector Modal State
  const [modalType, setModalType] = useState<'governorate' | 'wilaya' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [governoratesList, setGovernoratesList] = useState<GovernorateRef[]>([])
  const [wilayasList, setWilayasList] = useState<WilayaRef[]>([])

  // Initialize fields
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setBio(user.bio || '')
      setGovernorateId(user.governorateId || null)
      setWilayaId(user.wilayaId || null)
      setGovernorateName(user.governorateRef?.nameAr || user.governorate || '')
      setWilayaName(user.wilayaRef?.nameAr || user.city || '')
      setAvatarUrl(user.avatarUrl || user.avatar || '')
    }
  }, [user])

  // Resolve governorate name if user had ID but no name
  useEffect(() => {
    if (governorateId && !governorateName) {
      locationsApi.getGovernorates().then((list) => {
        const found = list.find((g) => g.id === governorateId)
        if (found) setGovernorateName(found.nameAr)
      }).catch(() => {})
    }
  }, [governorateId, governorateName])

  // Resolve wilaya name if user had ID but no name
  useEffect(() => {
    if (governorateId && wilayaId && !wilayaName) {
      locationsApi.getWilayas(governorateId).then((list) => {
        const found = list.find((w) => w.id === wilayaId)
        if (found) setWilayaName(found.nameAr)
      }).catch(() => {})
    }
  }, [governorateId, wilayaId, wilayaName])

  const rawAvatar = avatarUrl || user?.avatarUrl || user?.avatar
  const displayAvatar = rawAvatar
    ? rawAvatar.startsWith('http') || rawAvatar.startsWith('file')
      ? rawAvatar
      : `${Config.apiUrl}${rawAvatar.startsWith('/') ? '' : '/'}${rawAvatar}`
    : null

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setAvatarUrl(result.assets[0].uri)
      }
    } catch {
      dialogService.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة')
    }
  }

  // Open Governorates Modal
  const openGovernoratePicker = async () => {
    setSearchQuery('')
    setModalType('governorate')
    if (governoratesList.length === 0) {
      setLoadingLocations(true)
      try {
        const data = await locationsApi.getGovernorates()
        setGovernoratesList(data)
      } catch {
        dialogService.alert('خطأ', 'تعذر تحميل قائمة المحافظات')
      } finally {
        setLoadingLocations(false)
      }
    }
  }

  // Open Wilayas Modal
  const openWilayaPicker = async () => {
    if (!governorateId) {
      dialogService.alert('تنبيه', 'يرجى اختيار المحافظة أولاً')
      return
    }
    setSearchQuery('')
    setModalType('wilaya')
    setLoadingLocations(true)
    try {
      const data = await locationsApi.getWilayas(governorateId)
      setWilayasList(data)
    } catch {
      dialogService.alert('خطأ', 'تعذر تحميل قائمة الولايات')
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleSelectGovernorate = (gov: GovernorateRef) => {
    Haptics.selectionAsync().catch(() => {})
    setGovernorateId(gov.id)
    setGovernorateName(gov.nameAr)
    setWilayaId(null)
    setWilayaName('')
    setModalType(null)

    // Auto open wilaya picker for smooth UX
    setTimeout(() => {
      setModalType('wilaya')
      setLoadingLocations(true)
      locationsApi.getWilayas(gov.id)
        .then((data) => setWilayasList(data))
        .catch(() => {})
        .finally(() => setLoadingLocations(false))
    }, 250)
  }

  const handleSelectWilaya = (w: WilayaRef) => {
    Haptics.selectionAsync().catch(() => {})
    setWilayaId(w.id)
    setWilayaName(w.nameAr)
    setModalType(null)
  }

  // Filtered List
  const filteredList = useMemo(() => {
    const rawList = modalType === 'governorate' ? governoratesList : wilayasList
    if (!searchQuery.trim()) return rawList

    const q = normalizeArabic(searchQuery)
    return rawList.filter((item) => {
      const ar = normalizeArabic(item.nameAr || '')
      const en = (item.nameEn || '').toLowerCase()
      return ar.includes(q) || en.includes(searchQuery.toLowerCase().trim())
    })
  }, [modalType, searchQuery, governoratesList, wilayasList])

  const handleSave = async () => {
    if (!displayName.trim()) {
      dialogService.alert('تنبيه', 'يرجى إدخال الاسم المستعار')
      return
    }

    try {
      setLoading(true)
      let finalAvatarUrl = avatarUrl

      // If avatarUrl is a local file URI, upload it first
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        const filename = avatarUrl.split('/').pop() || 'avatar.jpg'
        const match = /\.(\w+)$/.exec(filename)
        const type = match ? `image/${match[1]}` : `image/jpeg`

        const formData = new FormData()
        formData.append('file', {
          uri: avatarUrl,
          name: filename,
          type,
        } as any)

        const uploadRes = await uploadsApi.single(formData)
        if (uploadRes.data?.url) {
          finalAvatarUrl = uploadRes.data.url
        }
      }

      const res = await usersApi.updateProfile({
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        governorateId: governorateId ?? undefined,
        wilayaId: wilayaId ?? undefined,
        avatarUrl: finalAvatarUrl || undefined,
      })

      if (res.data) {
        useAuthStore.setState((state) => ({
          user: state.user ? {
            ...state.user,
            ...res.data,
            governorateRef: governorateId && governorateName ? { id: governorateId, nameAr: governorateName } : state.user.governorateRef,
            wilayaRef: wilayaId && wilayaName ? { id: wilayaId, nameAr: wilayaName } : state.user.wilayaRef,
          } : res.data,
        }))
        dialogService.alert('نجاح', 'تم تحديث الملف الشخصي بنجاح!', 'success')
        router.back()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء التحديث'
      dialogService.alert('خطأ', typeof msg === 'string' ? msg : Array.isArray(msg) ? msg[0] : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.root}>
        {/* ── Nav Bar (matches profile.tsx exactly) ── */}
        <View style={[s.navBarFixed, { paddingTop: insets.top }]}>
          <View style={s.navBarRow}>
            {/* Back Button (physical right in RTL) */}
            <TouchableOpacity
              style={s.navBtn}
              activeOpacity={0.75}
              onPress={() => router.back()}
              accessibilityLabel="رجوع"
            >
              <Ionicons name="arrow-forward-outline" size={18} color="#1E293B" />
            </TouchableOpacity>

            {/* Title Badge */}
            <View style={s.navTitleBadge}>
              <Text style={s.navTitle} numberOfLines={1}>تعديل الملف الشخصي</Text>
            </View>

            {/* Action Buttons (physical left in RTL) */}
            <View style={s.navActions}>
              <TouchableOpacity
                style={s.navBtn}
                activeOpacity={0.75}
                onPress={() => router.push('/(tabs)/chat' as any)}
                accessibilityLabel="الرسائل"
              >
                <Ionicons name="chatbubble-outline" size={17} color="#1E293B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={s.navBtn}
                activeOpacity={0.75}
                onPress={() => router.push('/profile/notifications' as any)}
                accessibilityLabel="الإشعارات"
              >
                <Ionicons name="notifications-outline" size={17} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[s.content, { paddingTop: insets.top + 56 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={s.avatarSection}>
            <TouchableOpacity style={s.avatarWrap} activeOpacity={0.85} onPress={handlePickImage}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={s.avatar} contentFit="cover" />
              ) : (
                <View style={[s.avatar, s.avatarFallback]}>
                  <Ionicons name="person" size={32} color={Colors.white} />
                </View>
              )}
              <View style={s.cameraBadge}>
                <Ionicons name="camera" size={13} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={s.avatarHint}>تغيير الصورة الشخصية</Text>
          </View>

          {/* ── Section 1: Basic Info ── */}
          <View style={s.sectionWrap}>
            <Text style={s.sectionHeaderTitle}>المعلومات الأساسية</Text>
            <View style={s.cardGroup}>
              {/* Display Name Field */}
              <View style={s.fieldWrapper}>
                <View style={s.fieldLabelRow}>
                  <Text style={s.label}>الاسم المستعار</Text>
                  <View style={s.badgeRequired}>
                    <Text style={s.badgeRequiredText}>مطلوب</Text>
                  </View>
                </View>
                <View style={[s.inputBox, focusedField === 'displayName' && s.inputBoxFocused]}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={focusedField === 'displayName' ? Colors.primary : '#64748B'}
                    style={s.fieldIconStart}
                  />
                  <TextInput
                    style={s.textInput}
                    placeholder="اكتب اسمك ليظهر للآخرين"
                    placeholderTextColor="#94A3B8"
                    value={displayName}
                    onChangeText={setDisplayName}
                    onFocus={() => setFocusedField('displayName')}
                    onBlur={() => setFocusedField(null)}
                    textAlign="right"
                    writingDirection="rtl"
                  />
                </View>
              </View>

              {/* Bio Field */}
              <View style={s.fieldWrapper}>
                <View style={s.fieldLabelRow}>
                  <Text style={s.label}>نبذة عنك</Text>
                  <View style={s.badgeOptional}>
                    <Text style={s.badgeOptionalText}>اختياري</Text>
                  </View>
                </View>
                <View style={[s.inputBoxMultiline, focusedField === 'bio' && s.inputBoxFocused]}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={focusedField === 'bio' ? Colors.primary : '#64748B'}
                    style={s.fieldIconMultilineStart}
                  />
                  <TextInput
                    style={s.textInputMultiline}
                    placeholder="اكتب نبذة مختصرة عن نفسك أو نشاطك التجاري..."
                    placeholderTextColor="#94A3B8"
                    value={bio}
                    onChangeText={setBio}
                    onFocus={() => setFocusedField('bio')}
                    onBlur={() => setFocusedField(null)}
                    multiline
                    textAlign="right"
                    writingDirection="rtl"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* ── Section 2: Contact Info ── */}
          <View style={s.sectionWrap}>
            <Text style={s.sectionHeaderTitle}>معلومات التواصل</Text>
            <View style={s.cardGroup}>
              {/* Phone Field */}
              <View style={s.fieldWrapper}>
                <View style={s.fieldLabelRow}>
                  <Text style={s.label}>رقم الهاتف</Text>
                </View>
                <View style={[s.inputBox, focusedField === 'phone' && s.inputBoxFocused]}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={focusedField === 'phone' ? Colors.primary : '#64748B'}
                    style={[s.fieldIconStart, I18nManager.isRTL && { transform: [{ scaleX: -1 }] }]}
                  />
                  <TextInput
                    style={[s.textInput, s.textInputLtr]}
                    placeholder="مثال: 98765432"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    textAlign="left"
                    writingDirection="ltr"
                  />
                </View>
              </View>

              {/* Email Field (Read Only) */}
              <View style={s.fieldWrapper}>
                <View style={s.fieldLabelRow}>
                  <Text style={s.label}>البريد الإلكتروني</Text>
                  <View style={s.badgeLocked}>
                    <Ionicons name="lock-closed" size={10} color="#64748B" style={{ marginEnd: 3 }} />
                    <Text style={s.badgeLockedText}>ثابت</Text>
                  </View>
                </View>
                <View style={[s.inputBox, s.inputBoxDisabled]}>
                  <Ionicons name="mail-outline" size={18} color="#94A3B8" style={[s.fieldIconStart, I18nManager.isRTL && { transform: [{ scaleX: -1 }] }]} />
                  <TextInput
                    style={[s.textInput, s.textInputLtr, { color: '#64748B' }]}
                    placeholder="بريدك الإلكتروني"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    value={email}
                    editable={false}
                    textAlign="left"
                    writingDirection="ltr"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* ── Section 3: Location ── */}
          <View style={s.sectionWrap}>
            <Text style={s.sectionHeaderTitle}>الموقع الجغرافي</Text>
            <View style={s.cardGroup}>
              {/* Governorate Field */}
              <View style={s.fieldWrapper}>
                <View style={s.fieldLabelRow}>
                  <Text style={s.label}>المحافظة</Text>
                </View>
                <TouchableOpacity
                  style={[s.inputBox, governorateId !== null && s.inputBoxActive]}
                  activeOpacity={0.75}
                  onPress={openGovernoratePicker}
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={governorateId ? Colors.primary : '#64748B'}
                    style={s.fieldIconStart}
                  />
                  <Text
                    style={[s.inputTextDisplay, !governorateName && s.placeholderText]}
                    numberOfLines={1}
                  >
                    {governorateName || 'اختر المحافظة'}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={governorateId ? Colors.primary : '#94A3B8'}
                    style={s.fieldIconEnd}
                  />
                </TouchableOpacity>
              </View>

              {/* Wilaya Field */}
              <View style={s.fieldWrapper}>
                <View style={s.fieldLabelRow}>
                  <Text style={s.label}>الولاية / المدينة</Text>
                </View>
                <TouchableOpacity
                  style={[
                    s.inputBox,
                    !governorateId && s.inputBoxDisabled,
                    wilayaId !== null && s.inputBoxActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={openWilayaPicker}
                  disabled={!governorateId}
                >
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color={!governorateId ? '#CBD5E1' : wilayaId ? Colors.primary : '#64748B'}
                    style={s.fieldIconStart}
                  />
                  <Text
                    style={[
                      s.inputTextDisplay,
                      !wilayaName && s.placeholderText,
                      !governorateId && { color: '#94A3B8' },
                    ]}
                    numberOfLines={1}
                  >
                    {wilayaName || 'اختر الولاية'}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={!governorateId ? '#CBD5E1' : wilayaId ? Colors.primary : '#94A3B8'}
                    style={s.fieldIconEnd}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <AppButton
            title="حفظ التعديلات"
            onPress={handleSave}
            loading={loading}
          />
        </View>

        {/* Location Picker Modal */}
        <Modal
          visible={modalType !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setModalType(null)}
        >
          <View style={s.modalOverlay}>
            <SafeAreaView style={s.modalSheet}>
              <View style={s.handleBar} />

              <View style={s.modalHeader}>
                <View>
                  <Text style={s.modalTitle}>
                    {modalType === 'governorate' ? 'اختر المحافظة' : `اختر الولاية (${governorateName})`}
                  </Text>
                  <Text style={s.modalSubtitle}>
                    {modalType === 'governorate'
                      ? 'حدد المحافظة لعرض الولايات التابعة لها'
                      : 'اختر ولايتك الحالية'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.modalCloseBtn}
                  onPress={() => setModalType(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={s.searchBox}>
                <Ionicons name="search" size={17} color="#94A3B8" style={{ marginEnd: 8 }} />
                <TextInput
                  style={s.searchInput}
                  placeholder={modalType === 'governorate' ? 'ابحث عن المحافظة...' : 'ابحث عن الولاية...'}
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  textAlign="right"
                  writingDirection="rtl"
                  clearButtonMode="while-editing"
                />
              </View>

              {/* List or Loading */}
              {loadingLocations ? (
                <View style={s.loadingBox}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={s.loadingText}>جاري تحميل المواقع...</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredList}
                  keyExtractor={(item) => String(item.id)}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={s.listContent}
                  renderItem={({ item }) => {
                    const isSelected =
                      modalType === 'governorate'
                        ? item.id === governorateId
                        : item.id === wilayaId
                    return (
                      <TouchableOpacity
                        style={[s.listItem, isSelected && s.listItemSelected]}
                        activeOpacity={0.7}
                        onPress={() =>
                          modalType === 'governorate'
                            ? handleSelectGovernorate(item as GovernorateRef)
                            : handleSelectWilaya(item as WilayaRef)
                        }
                      >
                        <View style={s.listItemLeft}>
                          <View
                            style={[s.radioCircle, isSelected && s.radioCircleSelected]}
                          >
                            {isSelected && (
                              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                            )}
                          </View>
                        </View>
                        <View style={s.listItemContent}>
                          <Text
                            style={[
                              s.listItemText,
                              isSelected && s.listItemTextSelected,
                            ]}
                          >
                            {item.nameAr}
                          </Text>
                          {item.nameEn ? (
                            <Text style={s.listItemSubText}>{item.nameEn}</Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    )
                  }}
                  ListEmptyComponent={
                    <View style={s.emptyBox}>
                      <Ionicons name="search-outline" size={32} color="#CBD5E1" />
                      <Text style={s.emptyText}>لا توجد نتائج مطابقة</Text>
                    </View>
                  }
                />
              )}
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  )
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: { elevation: 1.5 },
})

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

  /* Fixed Top Navigation Bar — same as profile.tsx */
  navBarFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  navBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
    height: 44,
    gap: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  navTitleBadge: {
    flex: 1,
    height: 38,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  navTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 19,
    color: '#1E293B',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  /* Avatar Section */
  avatarSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#E2E8F0',
  },
  avatarFallback: {
    backgroundColor: Colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    backgroundColor: Colors.primaryDark,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 5,
  },
  avatarHint: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
    marginTop: 8,
  },

  /* Sections & Cards */
  sectionWrap: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#64748B',
    marginBottom: 7,
    paddingHorizontal: 4,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...softShadow,
  },

  /* Form Fields */
  fieldWrapper: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  badgeRequired: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeRequiredText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    lineHeight: 13,
    color: '#DC2626',
    writingDirection: 'rtl',
  },
  badgeOptional: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeOptionalText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    lineHeight: 13,
    color: '#64748B',
    writingDirection: 'rtl',
  },
  badgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeLockedText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    lineHeight: 13,
    color: '#64748B',
    writingDirection: 'rtl',
  },

  /* Input Boxes */
  inputBox: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputBoxMultiline: {
    minHeight: 88,
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputBoxFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputBoxDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },

  /* Field Icons */
  fieldIconStart: {
    marginEnd: 10,
  },
  fieldIconMultilineStart: {
    marginEnd: 10,
    marginTop: 2,
  },
  fieldIconEnd: {
    marginStart: 8,
  },

  /* Text Inputs */
  textInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: 0,
  },
  textInputLtr: {
    fontFamily: 'Almarai_700Bold',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  textInputMultiline: {
    flex: 1,
    minHeight: 68,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'right',
    writingDirection: 'rtl',
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  inputTextDisplay: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholderText: {
    fontFamily: 'Almarai_400Regular',
    color: '#94A3B8',
  },

  /* Footer */
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  /* Bottom Sheet Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopStartRadius: 22,
    borderTopEndRadius: 22,
    maxHeight: '80%',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15.5,
    lineHeight: 21,
    color: '#1E293B',
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  modalSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#94A3B8',
    writingDirection: 'rtl',
    textAlign: 'left',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  searchBox: {
    marginHorizontal: 14,
    marginVertical: 10,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#1E293B',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  listContent: {
    paddingBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  listItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  listItemLeft: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
    marginStart: 8,
  },
  listItemText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  listItemTextSelected: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  listItemSubText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#94A3B8',
    writingDirection: 'ltr',
    textAlign: 'left',
    marginTop: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#64748B',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#94A3B8',
    writingDirection: 'rtl',
  },
})
