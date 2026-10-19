import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAccountDeletion } from '../../hooks/useAccountDeletion'
import { formatDeletionDate } from '../../utils/formatDeletionDate'

interface DeletionScheduledBannerProps {
  style?: StyleProp<ViewStyle>
}

export function DeletionScheduledBanner({ style }: DeletionScheduledBannerProps) {
  const { isScheduled, deletionScheduledAt, cancelling, handleCancelDeletion } =
    useAccountDeletion()

  if (!isScheduled || !deletionScheduledAt) {
    return null
  }

  const formattedDate = formatDeletionDate(deletionScheduledAt)

  return (
    <View style={[s.banner, style]} testID="deletion-scheduled-banner">
      <View style={s.iconWrap}>
        <Ionicons name="time-outline" size={22} color="#EA580C" />
      </View>
      <View style={s.textWrap}>
        <Text style={s.title}>حسابك مجدول للحذف</Text>
        <Text style={s.subtitle}>
          سيتم حذف حسابك يوم {formattedDate}. إعلاناتك مخفية حالياً.
        </Text>
        <TouchableOpacity
          testID="deletion-banner-cancel-btn"
          style={s.cancelBtn}
          onPress={handleCancelDeletion}
          disabled={cancelling}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="إلغاء طلب الحذف"
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#9A3412" />
          ) : (
            <Text style={s.cancelBtnText}>إلغاء طلب الحذف</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  banner: {
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
  iconWrap: {
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
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#9A3412',
    writingDirection: 'rtl',
    textAlign: 'left',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 17,
    color: '#C2410C',
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#9A3412',
    writingDirection: 'rtl',
  },
})
