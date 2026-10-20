import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { Colors } from '../../src/constants/colors'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { AppButton } from '../../src/components/ui/AppButton'
import { GoogleIcon } from '../../src/components/ui/GoogleIcon'
import { authApi } from '../../src/api/auth'
import { usersApi, DeleteAccountPayload } from '../../src/api/users'
import { useAuthStore } from '../../src/store/authStore'
import { dialogService } from '../../src/store/dialogStore'
import { formatDeletionDate } from '../../src/utils/formatDeletionDate'
import { useAccountDeletion } from '../../src/hooks/useAccountDeletion'
import {
  GoogleSignin,
  isGoogleSignInAvailable,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '../../src/services/googleAuth'
import {
  isAppleAuthAvailable,
  performAppleReauth,
  AppleReauthResult,
  AppleAuthError,
} from '../../src/services/appleAuth'

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const { cancelling, handleCancelDeletion } = useAccountDeletion()

  // Initial Fetch & Loading State
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialError, setInitialError] = useState(false)

  // Reauth method determined by server
  const [reauthMethod, setReauthMethod] = useState<'password' | 'google' | 'apple' | 'confirmation'>(
    user?.deletionReauthMethod || 'confirmation'
  )

  // Form Fields
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [googleIdToken, setGoogleIdToken] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleCredentials, setAppleCredentials] = useState<AppleReauthResult | null>(null)
  const [appleLoading, setAppleLoading] = useState(false)
  const [appleAvailable, setAppleAvailable] = useState<boolean | null>(null)
  const [confirmation, setConfirmation] = useState('')

  // Field Focus & Blur States
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [confirmationBlurred, setConfirmationBlurred] = useState(false)

  // Submission State
  const [submitting, setSubmitting] = useState(false)

  const isScheduled = Boolean(user?.deletionScheduledAt)

  const fetchInitialData = useCallback(async () => {
    setInitialLoading(true)
    setInitialError(false)
    try {
      const res = await authApi.me()
      const data = res.data as any
      const freshUser = data?.user ?? data
      if (freshUser) {
        useAuthStore.getState().updateUser(freshUser)
        if (freshUser.deletionReauthMethod) {
          setReauthMethod(freshUser.deletionReauthMethod)
        }
      }
    } catch {
      setInitialError(true)
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInitialData()
    isAppleAuthAvailable().then(setAppleAvailable)
  }, [fetchInitialData])

  // Google Sign-In Confirmation
  const handleGoogleConfirm = async () => {
    if (!isGoogleSignInAvailable() || !GoogleSignin) {
      return
    }

    setGoogleLoading(true)
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      }
      const response = await GoogleSignin.signIn()
      if (!isSuccessResponse(response)) {
        return
      }

      const idToken = response.data?.idToken
      if (!idToken) {
        dialogService.alert('خطأ', 'تعذر الحصول على رمز التحقق من Google. يرجى إعادة المحاولة.')
        return
      }

      setGoogleIdToken(idToken)
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED || err.code === statusCodes.IN_PROGRESS) {
          return
        }
      }
      dialogService.alert('خطأ', 'فشل التحقق عبر حساب Google. يرجى إعادة المحاولة.')
    } finally {
      setGoogleLoading(false)
    }
  }

  // Apple Sign-In Confirmation
  const handleAppleConfirm = async () => {
    setAppleLoading(true)
    try {
      const creds = await performAppleReauth()
      if (!creds) {
        return
      }
      if (!creds.appleAuthorizationCode) {
        dialogService.alert('خطأ', 'لم يتم استلام رمز التفويض من Apple. يرجى المحاولة مرة أخرى.')
        return
      }
      setAppleCredentials(creds)
    } catch (err: any) {
      console.error('[Apple Reauth Error]', err)
      const msg =
        err instanceof AppleAuthError
          ? err.message
          : 'فشل التحقق عبر حساب Apple. يرجى إعادة المحاولة.'
      dialogService.alert('خطأ', msg)
    } finally {
      setAppleLoading(false)
    }
  }

  // Confirmation phrase validation
  const cleanConfirmation = confirmation.trim()
  const isPhraseValid = cleanConfirmation === 'حذف حسابي' || cleanConfirmation === 'DELETE'
  const showPhraseError = confirmationBlurred && cleanConfirmation.length > 0 && !isPhraseValid

  // Submission eligibility
  const isPasswordReady = reauthMethod !== 'password' || password.length > 0
  const isGoogleReady = reauthMethod !== 'google' || Boolean(googleIdToken)
  const isAppleReady =
    reauthMethod !== 'apple' ||
    Boolean(
      appleCredentials?.appleIdentityToken &&
      appleCredentials?.appleNonce &&
      appleCredentials?.appleAuthorizationCode
    )
  const isSubmitDisabled = !isPhraseValid || !isPasswordReady || !isGoogleReady || !isAppleReady || submitting

  // Submission Handler
  const handleSubmit = () => {
    if (isSubmitDisabled) return

    dialogService.confirm(
      'حذف الحساب',
      'هل أنت متأكد تماماً من رغبتك في تقديم طلب حذف حسابك؟',
      async () => {
        try {
          setSubmitting(true)
          const payload: DeleteAccountPayload = {
            confirmation: cleanConfirmation,
            ...(reauthMethod === 'password' ? { password } : {}),
            ...(reauthMethod === 'google' ? { googleIdToken: googleIdToken! } : {}),
            ...(reauthMethod === 'apple' && appleCredentials
              ? {
                  appleIdentityToken: appleCredentials.appleIdentityToken,
                  appleNonce: appleCredentials.appleNonce,
                  appleAuthorizationCode: appleCredentials.appleAuthorizationCode,
                }
              : {}),
          }

          await usersApi.deleteAccount(payload)

          dialogService.alert(
            'تم استلام الطلب',
            'تم استلام طلب حذف حسابك. ستصلك رسالة على بريدك الإلكتروني بالتفاصيل.',
            'success'
          )

          // ── Explicit Post-Deletion Sequence (Modification 1) ──
          // 1. Delete tokens from SecureStore FIRST so logout doesn't fire backend calls
          await SecureStore.deleteItemAsync('accessToken')
          await SecureStore.deleteItemAsync('refreshToken')

          // 2. Call authStore.logout() to clear all in-memory and local data
          await useAuthStore.getState().logout()

          // 3. Navigate to login screen ONCE
          router.replace('/(auth)/login')
        } catch (err: any) {
          if (reauthMethod === 'apple') {
            setAppleCredentials(null)
          }

          const status = err?.response?.status
          const serverMessage = err?.response?.data?.message
          const errorCode = err?.response?.data?.code

          let errorMsg = 'تعذر إتمام طلب حذف الحساب. يرجى المحاولة مرة أخرى.'

          if (status === 401 && errorCode === 'APPLE_REAUTH_REQUIRED') {
            errorMsg = 'يرجى إعادة المصادقة باستخدام Apple لمتابعة حذف الحساب.'
          } else if (
            status === 503 &&
            (errorCode === 'APPLE_REVOCATION_UNAVAILABLE' || errorCode === 'APPLE_SERVICE_ERROR')
          ) {
            errorMsg = 'تعذر إتمام الحذف الآن، حاول لاحقاً'
          } else if (typeof serverMessage === 'string') {
            errorMsg = serverMessage
          } else if (Array.isArray(serverMessage) && serverMessage.length > 0) {
            errorMsg = serverMessage[0]
          } else if (status === 401) {
            errorMsg = 'بيانات التحقق غير صحيحة. يرجى التأكد من كلمة المرور أو رمز التحقق.'
          } else if (status === 403) {
            errorMsg = 'لا يمكن حذف الحساب نظراً لحالة الحساب الحالية.'
          } else if (status === 409) {
            errorMsg = 'لديك عمليات دفع قيد المعالجة، لا يمكن حذف الحساب الآن.'
          } else if (status === 429) {
            errorMsg = 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً.'
          }

          dialogService.alert('خطأ', errorMsg)
        } finally {
          setSubmitting(false)
        }
      },
      'حذف حسابي',
      'إلغاء',
      true
    )
  }

  return (
    <KeyboardAvoidingView
      style={s.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.root}>
        {/* ── Fixed Navigation Bar ── */}
        <GlassNavBar
          title="حذف الحساب"
          paddingTop={insets.top}
          onBackPress={() => router.back()}
          actions={[
            {
              icon: 'chatbubble-outline',
              onPress: () => router.push('/(tabs)/chat' as any),
              accessibilityLabel: 'الرسائل والمحادثات',
            },
            {
              icon: 'notifications-outline',
              onPress: () => router.push('/profile/notifications' as any),
              accessibilityLabel: 'الإشعارات',
            },
          ]}
        />

        <ScrollView
          style={s.scrollView}
          contentContainerStyle={[
            s.contentContainer,
            {
              paddingTop: insets.top + 66,
              paddingBottom: 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* ── Loading State ── */}
          {initialLoading ? (
            <View style={s.centerState}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : initialError ? (
            /* ── Error State ── */
            <View style={s.cardGroup}>
              <Text style={s.errorTitle}>تعذر تحميل بيانات الحساب</Text>
              <Text style={s.errorSubtitle}>تحقق من الاتصال وحاول مرة أخرى</Text>
              <AppButton
                title="إعادة المحاولة"
                variant="outline"
                size="sm"
                onPress={fetchInitialData}
                style={s.retryBtn}
              />
            </View>
          ) : isScheduled ? (
            /* ── State: Scheduled For Deletion ── */
            <>
              {/* Orange Scheduled Card */}
              <View style={s.scheduledCard}>
                <View style={s.scheduledIconWrap}>
                  <Ionicons name="time-outline" size={22} color="#EA580C" />
                </View>
                <View style={s.scheduledTextWrap}>
                  <Text style={s.scheduledTitle}>حسابك مجدول للحذف</Text>
                  <Text style={s.scheduledDate}>
                    {formatDeletionDate(user?.deletionScheduledAt)}
                  </Text>
                  <Text style={s.scheduledSubtitle}>
                    إعلاناتك ومعلوماتك مخفية حالياً. يمكنك إلغاء الطلب في أي وقت قبل هذا الموعد.
                  </Text>
                </View>
              </View>

              {/* What happens after deletion */}
              <View style={s.sectionWrap}>
                <Text style={s.sectionHeaderTitle}>ماذا سيحدث بعد الموعد</Text>
                <View style={s.listCardGroup}>
                  {/* Row 3 */}
                  <View style={s.rowItem}>
                    <View style={s.rowIconWrap}>
                      <Ionicons name="person-remove-outline" size={18} color="#334155" />
                    </View>
                    <Text style={s.rowText}>
                      بعد انتهاء المهلة تُحذف بياناتك الشخصية (الاسم والإيميل ورقم الهاتف والصور وبيانات التواصل والموقع) ولا يمكن استرجاعها.
                    </Text>
                  </View>
                  <View style={s.rowDivider} />

                  {/* Row 4 */}
                  <View style={s.rowItem}>
                    <View style={s.rowIconWrap}>
                      <Ionicons name="chatbubbles-outline" size={18} color="#334155" />
                    </View>
                    <Text style={s.rowText}>
                      الرسائل التي أرسلتها تبقى ظاهرة للطرف الآخر باسم «مستخدم محذوف».
                    </Text>
                  </View>
                  <View style={s.rowDivider} />

                  {/* Row 5 */}
                  <View style={s.rowItem}>
                    <View style={s.rowIconWrap}>
                      <Ionicons name="card-outline" size={18} color="#334155" />
                    </View>
                    <Text style={s.rowText}>
                      لن يتم استرداد قيمة أي اشتراك أو خدمة مدفوعة، وتُحفظ سجلات الدفع وفق المتطلبات المحاسبية والقانونية في سلطنة عُمان.
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* ── State: Not Scheduled ── */
            <>
              {/* Red Warning Banner */}
              <View style={s.warningBanner}>
                <View style={s.warningIconWrap}>
                  <Ionicons name="warning" size={22} color="#DC2626" />
                </View>
                <View style={s.warningTextWrap}>
                  <Text style={s.warningTitle}>
                    حذف الحساب إجراء لا يمكن التراجع عنه بعد انتهاء المهلة
                  </Text>
                  <Text style={s.warningSubtitle}>
                    راجع ما سيحدث قبل المتابعة. يمكنك إلغاء الطلب خلال 5 أيام.
                  </Text>
                </View>
              </View>

              {/* What will happen section */}
              <View style={s.sectionWrap}>
                <Text style={s.sectionHeaderTitle}>ماذا سيحدث عند الحذف</Text>
                <View style={s.listCardGroup}>
                  {/* Row 1 */}
                  <View style={s.rowItem}>
                    <View style={s.rowIconWrap}>
                      <Ionicons name="eye-off-outline" size={18} color="#334155" />
                    </View>
                    <Text style={s.rowText}>
                      عند تأكيد الطلب يتم إخفاء إعلاناتك وملفاتك الشخصية فوراً، وتسجيل خروجك من كل الأجهزة، وإيقاف التجديد التلقائي لاشتراكك.
                    </Text>
                  </View>
                  <View style={s.rowDivider} />

                  {/* Row 2 */}
                  <View style={s.rowItem}>
                    <View style={s.rowIconWrap}>
                      <Ionicons name="time-outline" size={18} color="#334155" />
                    </View>
                    <Text style={s.rowText}>
                      لديك 5 أيام لإلغاء الطلب من الإعدادات ثم حذف الحساب ثم الضغط على «إلغاء طلب الحذف».
                    </Text>
                  </View>
                  <View style={s.rowDivider} />

                  {/* Row 3 */}
                  <View style={s.rowItem}>
                    <View style={s.rowIconWrap}>
                      <Ionicons name="person-remove-outline" size={18} color="#334155" />
                    </View>
                    <Text style={s.rowText}>
                      بعد انتهاء المهلة تُحذف بياناتك الشخصية (الاسم والإيميل ورقم الهاتف والصور وبيانات التواصل والموقع) ولا يمكن استرجاعها.
                    </Text>
                  </View>
                  <View style={s.rowDivider} />

                  {/* Row 4 */}
                  <View style={s.rowItem}>
                    <View style={s.rowIconWrap}>
                      <Ionicons name="chatbubbles-outline" size={18} color="#334155" />
                    </View>
                    <Text style={s.rowText}>
                      الرسائل التي أرسلتها تبقى ظاهرة للطرف الآخر باسم «مستخدم محذوف».
                    </Text>
                  </View>
                  <View style={s.rowDivider} />

                  {/* Row 5 */}
                  <View style={s.rowItem}>
                    <View style={s.rowIconWrap}>
                      <Ionicons name="card-outline" size={18} color="#334155" />
                    </View>
                    <Text style={s.rowText}>
                      لن يتم استرداد قيمة أي اشتراك أو خدمة مدفوعة، وتُحفظ سجلات الدفع وفق المتطلبات المحاسبية والقانونية في سلطنة عُمان.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Confirmation Inputs Form */}
              <View style={s.sectionWrap}>
                <Text style={s.sectionHeaderTitle}>تأكيد الحذف</Text>
                <View style={s.cardGroup}>
                  {/* Field A: Reauth Method */}
                  {reauthMethod === 'password' && (
                    <View style={s.fieldWrapper}>
                      <View style={s.fieldLabelRow}>
                        <Text style={s.label}>كلمة المرور</Text>
                        <View style={s.badgeRequired}>
                          <Text style={s.badgeRequiredText}>مطلوب</Text>
                        </View>
                      </View>
                      <View
                        style={[
                          s.inputBox,
                          focusedField === 'password' && s.inputBoxFocused,
                        ]}
                      >
                        <Ionicons
                          name="lock-closed-outline"
                          size={18}
                          color={focusedField === 'password' ? Colors.primary : '#64748B'}
                          style={s.fieldIconStart}
                        />
                        <TextInput
                          testID="delete-account-password-input"
                          style={s.textInput}
                          placeholder="أدخل كلمة المرور"
                          placeholderTextColor="#94A3B8"
                          value={password}
                          onChangeText={setPassword}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          secureTextEntry={!showPassword}
                          textAlign="right"
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={s.eyeBtn}
                          accessibilityRole="button"
                          accessibilityLabel={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {reauthMethod === 'google' && (
                    <View style={s.fieldWrapper}>
                      <View style={s.fieldLabelRow}>
                        <Text style={s.label}>التحقق بحساب Google</Text>
                        <View style={s.badgeRequired}>
                          <Text style={s.badgeRequiredText}>مطلوب</Text>
                        </View>
                      </View>
                      {googleIdToken ? (
                        <View style={s.googleConfirmedRow}>
                          <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                          <Text style={s.googleConfirmedText}>تم التأكيد بحساب Google</Text>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity
                            testID="delete-account-google-btn"
                            style={[
                              s.googleBtn,
                              !isGoogleSignInAvailable() && s.googleBtnDisabled,
                            ]}
                            onPress={handleGoogleConfirm}
                            disabled={!isGoogleSignInAvailable() || googleLoading}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="تأكيد بحساب Google"
                          >
                            {googleLoading ? (
                              <ActivityIndicator size="small" color="#1E293B" />
                            ) : (
                              <>
                                <GoogleIcon size={20} />
                                <Text style={s.googleBtnText}>تأكيد بحساب Google</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          {!isGoogleSignInAvailable() && (
                            <Text style={s.helpText}>
                              التأكيد بحساب Google غير متاح في هذه النسخة، يمكنك طلب الحذف عبر البريد الإلكتروني للدعم
                            </Text>
                          )}
                        </>
                      )}
                    </View>
                  )}

                  {reauthMethod === 'apple' && (
                    <View style={s.fieldWrapper}>
                      <View style={s.fieldLabelRow}>
                        <Text style={s.label}>التحقق بحساب Apple</Text>
                        <View style={s.badgeRequired}>
                          <Text style={s.badgeRequiredText}>مطلوب</Text>
                        </View>
                      </View>
                      {appleCredentials ? (
                        <View style={s.googleConfirmedRow}>
                          <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                          <Text style={s.googleConfirmedText}>تم التأكيد بحساب Apple</Text>
                        </View>
                      ) : Platform.OS !== 'ios' || appleAvailable === false ? (
                        <View style={s.unsupportedCard}>
                          <Ionicons name="information-circle-outline" size={22} color="#D97706" />
                          <Text style={s.unsupportedText} testID="apple-unsupported-message">
                            حسابك مسجل باستخدام Apple. لإتمام حذف الحساب، يرجى المتابعة من جهاز iOS أو تعيين كلمة مرور لحسابك أولاً.
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          testID="delete-account-apple-btn"
                          style={s.appleConfirmBtn}
                          onPress={handleAppleConfirm}
                          disabled={appleLoading}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityLabel="تأكيد بحساب Apple"
                        >
                          {appleLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                              <Text style={s.appleConfirmBtnText}>تأكيد بحساب Apple</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Field B: Confirmation Phrase */}
                  <View style={s.fieldWrapper}>
                    <View style={s.fieldLabelRow}>
                      <Text style={s.label}>اكتب «حذف حسابي» للتأكيد</Text>
                      <View style={s.badgeRequired}>
                        <Text style={s.badgeRequiredText}>مطلوب</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        s.inputBox,
                        focusedField === 'confirmation' && s.inputBoxFocused,
                        showPhraseError && s.inputBoxError,
                      ]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={
                          showPhraseError
                            ? '#DC2626'
                            : focusedField === 'confirmation'
                              ? Colors.primary
                              : '#64748B'
                        }
                        style={s.fieldIconStart}
                      />
                      <TextInput
                        testID="delete-account-confirm-input"
                        style={s.textInput}
                        placeholder="حذف حسابي"
                        placeholderTextColor="#94A3B8"
                        value={confirmation}
                        onChangeText={setConfirmation}
                        onFocus={() => setFocusedField('confirmation')}
                        onBlur={() => {
                          setFocusedField(null)
                          setConfirmationBlurred(true)
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        textAlign="right"
                      />
                    </View>
                    {showPhraseError ? (
                      <Text style={s.errorText}>
                        العبارة غير مطابقة. يجب كتابة «حذف حسابي» أو «DELETE» للمتابعة.
                      </Text>
                    ) : (
                      <Text style={s.helpText}>يجب كتابة العبارة كما هي للمتابعة</Text>
                    )}
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* ── Fixed Bottom Footer ── */}
        {!initialLoading && !initialError && (
          <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {isScheduled ? (
              <AppButton
                testID="delete-account-cancel-btn"
                title="إلغاء طلب الحذف"
                variant="primary"
                onPress={handleCancelDeletion}
                loading={cancelling}
              />
            ) : (
              <TouchableOpacity
                testID="delete-account-submit-btn"
                style={[
                  s.deleteBtn,
                  isSubmitDisabled && s.deleteBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitDisabled}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ disabled: isSubmitDisabled }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    <Text style={s.deleteBtnText}>حذف حسابي</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
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
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  centerState: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  errorSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 17,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    alignSelf: 'center',
  },

  /* Sections & Groups */
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
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    ...softShadow,
  },
  listCardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...softShadow,
  },

  /* Warning Banner (Red) */
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  warningIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  warningTextWrap: {
    flex: 1,
  },
  warningTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#991B1B',
    marginBottom: 4,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  warningSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 17,
    color: '#B91C1C',
    textAlign: 'left',
    writingDirection: 'rtl',
  },

  /* Scheduled Card (Orange) */
  scheduledCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  scheduledIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  scheduledTextWrap: {
    flex: 1,
  },
  scheduledTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#9A3412',
    marginBottom: 2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  scheduledDate: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 19,
    color: '#9A3412',
    marginBottom: 4,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  scheduledSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 17,
    color: '#C2410C',
    textAlign: 'left',
    writingDirection: 'rtl',
  },

  /* What happens rows */
  rowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    lineHeight: 19,
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 14,
  },

  /* Fields */
  fieldWrapper: {
    gap: 4,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 2,
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
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeRequiredText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    lineHeight: 13,
    color: '#DC2626',
  },
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
  inputBoxFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputBoxError: {
    borderColor: '#DC2626',
    backgroundColor: '#FFFBFB',
  },
  fieldIconStart: {
    marginEnd: 10,
  },
  eyeBtn: {
    padding: 4,
  },
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
    textAlignVertical: 'center',
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  helpText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#94A3B8',
    paddingHorizontal: 2,
    marginTop: 4,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  errorText: {
    width: '100%',
    alignSelf: 'stretch',
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#DC2626',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
    paddingHorizontal: 2,
  },

  /* Google Button & Confirmed Row */
  googleBtn: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleBtnDisabled: {
    opacity: 0.5,
  },
  googleBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    color: '#1E293B',
  },
  googleConfirmedRow: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleConfirmedText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    color: '#166534',
  },
  /* Apple Button & Unsupported Card */
  appleConfirmBtn: {
    height: 48,
    borderRadius: 13,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appleConfirmBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  unsupportedCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 13,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unsupportedText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  /* Fixed Bottom Footer */
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  deleteBtn: {
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
  },
  deleteBtnDisabled: {
    opacity: 0.45,
  },
  deleteBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14.5,
    lineHeight: 20,
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
})
