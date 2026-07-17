import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { AppInput } from '../../src/components/ui/AppInput'
import { LocationPicker } from '../../src/components/ui/LocationPicker'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { OMAN_GOVERNORATES, getWilayatsForGovernorate } from '../../src/constants/locations'
import { usersApi } from '../../src/api/users'
import { uploadsApi } from '../../src/api/uploads'
import { Config } from '../../src/constants/config'

export default function EditProfileScreen() {
  const { user, setAuth } = useAuthStore()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [city, setCity] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)

  // Initialize fields
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setBio(user.bio || '')
      setGovernorate(user.governorate || '')
      setCity(user.city || '')
      setAvatarUrl(user.avatarUrl || user.avatar || '')
    }
  }, [user])

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
        quality: 0.7,
      })

      if (!result.canceled && result.assets[0]) {
        setAvatarUrl(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة')
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      let finalAvatarUrl = avatarUrl

      // If avatarUrl is a local file URI from image picker, upload it first
      if (avatarUrl && avatarUrl.startsWith('file://')) {
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
        if (uploadRes.data && uploadRes.data.url) {
          finalAvatarUrl = uploadRes.data.url
        }
      }

        const res = await usersApi.updateProfile({
          displayName: displayName.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
          governorate: governorate.trim(),
          city: city.trim(),
          avatarUrl: finalAvatarUrl,
        })

      if (res.data) {
        useAuthStore.setState({ user: { ...user, ...res.data } })
        Alert.alert('نجاح', 'تم تحديث الملف الشخصي بنجاح!', [
          { text: 'حسناً', onPress: () => router.back() }
        ])
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء التحديث'
      Alert.alert('خطأ', typeof msg === 'string' ? msg : msg[0])
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
        <AppHeader title="تعديل الملف الشخصي" showBack />
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.avatarSection}>
            <TouchableOpacity style={s.avatarWrap} activeOpacity={0.8} onPress={handlePickImage}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={s.avatar} contentFit="cover" />
              ) : (
                <View style={[s.avatar, s.avatarFallback]}>
                  <Ionicons name="person" size={40} color={Colors.white} />
                </View>
              )}
              <View style={s.cameraBadge}>
                <Ionicons name="camera" size={16} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={s.avatarHint}>تغيير الصورة الشخصية</Text>
          </View>

          <Text style={s.sectionTitle}>المعلومات الأساسية</Text>
          <View style={s.card}>
            <View style={s.form}>
              <AppInput
                label="الاسم المستعار (Display Name)"
                placeholder="اكتب اسمك ليظهر للآخرين"
                value={displayName}
                onChangeText={setDisplayName}
                iconRight="person-outline"
              />

              <AppInput
                label="نبذة عنك (Bio)"
                placeholder="اكتب نبذة مختصرة عن نفسك"
                value={bio}
                onChangeText={setBio}
                iconRight="information-circle-outline"
                multiline
              />
            </View>
          </View>

          <Text style={s.sectionTitle}>معلومات التواصل</Text>
          <View style={s.card}>
            <View style={s.form}>
              <AppInput
                label="رقم الهاتف"
                placeholder="مثال: 98765432"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                iconLeft="call-outline"
                ltr
              />

              <AppInput
                label="البريد الإلكتروني"
                placeholder="بريدك الإلكتروني"
                keyboardType="email-address"
                value={email}
                editable={false}
                iconLeft="mail-outline"
                ltr
              />
            </View>
          </View>

          <Text style={s.sectionTitle}>العنوان</Text>
          <View style={s.card}>
            <View style={s.form}>
              <LocationPicker 
                governorate={governorate}
                onGovernorateChange={(val) => {
                  setGovernorate(val)
                  setCity('')
                }}
                city={city}
                onCityChange={setCity}
              />
            </View>
          </View>
        </ScrollView>

        <View style={s.footer}>
          <AppButton
            title="حفظ التعديلات"
            onPress={handleSave}
            loading={loading}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  content: {
    padding: Spacing.space4,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.space6,
    marginTop: Spacing.space2,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarFallback: {
    backgroundColor: Colors.primaryLight,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#f7f9fc',
  },
  avatarHint: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.text2,
    marginTop: Spacing.space3,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.space4,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 18,
    color: Colors.primary,
    marginBottom: Spacing.space3,
    writingDirection: 'rtl',
    textAlign: 'left',
    paddingHorizontal: 8,
  },
  form: {
    gap: Spacing.space4,
  },
  footer: {
    padding: Spacing.space4,
    paddingBottom: Platform.OS === 'ios' ? Spacing.space6 : Spacing.space4,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
})
