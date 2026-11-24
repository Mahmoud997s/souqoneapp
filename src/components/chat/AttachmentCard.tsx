import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { toastService } from '../../store/toastStore'

interface Props {
  fileName: string
  fileSize?: string
  fileType?: string
  url: string
  isOwn: boolean
  uploadProgress?: number
  onCancelUpload?: () => void
}

type IoniconsName = keyof typeof Ionicons.glyphMap

interface AttachmentTypeStyle {
  bg: string
  text: string
  icon: IoniconsName
  label: string
}

const TYPE_STYLES: Record<string, AttachmentTypeStyle> = {
  pdf: { bg: Colors.iosRedSoftBg, text: Colors.coralDanger, icon: 'document-text', label: 'PDF' },
  doc: { bg: Colors.blueSoft10, text: Colors.primaryStrong, icon: 'document', label: 'DOC' },
  xls: { bg: Colors.mintSoftBg, text: Colors.forestBadgeText, icon: 'stats-chart', label: 'XLS' },
  default: { bg: Colors.scrimDark05, text: Colors.textMuted, icon: 'document-attach', label: 'FILE' },
}

function getStyle(type: string) {
  const ext = (type || '').toLowerCase()
  if (ext.includes('pdf')) return TYPE_STYLES.pdf
  if (ext.includes('doc') || ext.includes('word')) return TYPE_STYLES.doc
  if (ext.includes('xls') || ext.includes('sheet')) return TYPE_STYLES.xls
  return TYPE_STYLES.default
}

export function AttachmentCard({
  fileName,
  fileSize,
  fileType,
  url,
  isOwn,
  uploadProgress,
  onCancelUpload,
}: Props) {
  const style = getStyle(fileType || fileName)
  const isUploading = typeof uploadProgress === 'number'
  const metaText = [fileSize, style.label].filter(Boolean).join(' · ')

  const handleOpen = async () => {
    if (isUploading) return
    try {
      if (url) {
        const supported = await Linking.canOpenURL(url)
        if (supported) {
          await Linking.openURL(url)
        } else {
          toastService.show({ kind: 'error', title: 'لا يمكن فتح هذا الملف' })
        }
      }
    } catch {
      toastService.show({ kind: 'error', title: 'حدث خطأ أثناء فتح الملف' })
    }
  }

  return (
    <View style={[s.wrapper, isOwn ? s.own : s.other]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleOpen}
        style={s.container}
        accessibilityRole="button"
        accessibilityLabel={fileName || 'ملف مرفق'}
      >
        <View style={[s.iconBox, { backgroundColor: style.bg }]}>
          <Ionicons name={style.icon} size={22} color={style.text} />
        </View>
        <View style={s.info}>
          <Text style={s.name} numberOfLines={1} ellipsizeMode="tail">
            {fileName || 'ملف مرفق'}
          </Text>
          <Text style={s.size} numberOfLines={1}>
            {isUploading ? `جاري الرفع ${uploadProgress}%` : metaText}
          </Text>
        </View>
        {isUploading && onCancelUpload ? (
          <TouchableOpacity
            onPress={onCancelUpload}
            style={s.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="إلغاء الرفع"
            testID="chat-upload-cancel-btn"
          >
            <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={s.actionBtn}>
            <Ionicons name="download-outline" size={20} color={Colors.primaryStrong} />
          </View>
        )}
      </TouchableOpacity>
      {isUploading ? (
        <View style={s.progressTrack} testID="chat-upload-progress-bar">
          <View style={[s.progressFill, { width: `${Math.max(5, Math.min(100, uploadProgress))}%` }]} />
        </View>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    width: 230,
    overflow: 'hidden',
  },
  own: { backgroundColor: Colors.whiteAlpha50 },
  other: { backgroundColor: Colors.gray50Surface },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 10,
  },
  info: { flex: 1, alignItems: 'flex-start' },
  name: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.primaryDeep,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginBottom: 2,
  },
  size: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  actionBtn: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: 4,
  },
  progressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: Colors.scrimDark10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryStrong,
  },
})
