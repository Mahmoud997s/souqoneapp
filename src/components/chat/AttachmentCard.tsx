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
}

type IoniconsName = keyof typeof Ionicons.glyphMap

interface AttachmentTypeStyle {
  bg: string
  text: string
  icon: IoniconsName
}

const TYPE_STYLES: Record<string, AttachmentTypeStyle> = {
  pdf: { bg: Colors.iosRedSoftBg, text: Colors.coralDanger, icon: 'document-text' },
  doc: { bg: Colors.blueSoft10, text: Colors.primary, icon: 'document' },
  xls: { bg: Colors.mintSoftBg, text: Colors.forestBadgeText, icon: 'stats-chart' },
  default: { bg: Colors.scrimDark05, text: Colors.textMuted, icon: 'document-attach' },
}

function getStyle(type: string) {
  const ext = (type || '').toLowerCase()
  if (ext.includes('pdf')) return TYPE_STYLES.pdf
  if (ext.includes('doc') || ext.includes('word')) return TYPE_STYLES.doc
  if (ext.includes('xls') || ext.includes('sheet')) return TYPE_STYLES.xls
  return TYPE_STYLES.default
}

export function AttachmentCard({ fileName, fileSize, fileType, url, isOwn }: Props) {
  const style = getStyle(fileType || fileName)

  const handleOpen = async () => {
    try {
      if (url) {
        const supported = await Linking.canOpenURL(url)
        if (supported) {
          await Linking.openURL(url)
        } else {
          toastService.show({ kind: 'error', title: 'لا يمكن فتح هذا الملف' })
        }
      }
    } catch (e) {
      toastService.show({ kind: 'error', title: 'حدث خطأ أثناء فتح الملف' })
    }
  }

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={handleOpen}
      style={[s.container, isOwn ? s.own : s.other]}
    >
      <View style={[s.iconBox, { backgroundColor: style.bg }]}>
        <Ionicons name={style.icon} size={24} color={style.text} />
      </View>
      <View style={s.info}>
        <Text style={[s.name, isOwn ? s.txtWhite : s.txtDark]} numberOfLines={1}>
          {fileName || 'ملف مرفق'}
        </Text>
        {fileSize ? (
          <Text style={[s.size, isOwn ? s.txtWhiteMuted : s.txtMuted]}>{fileSize}</Text>
        ) : null}
      </View>
      <View style={s.downloadBtn}>
        <Ionicons name="download-outline" size={20} color={isOwn ? Colors.white : Colors.primary} />
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    width: '100%',
    minWidth: 200,
  },
  own: { backgroundColor: Colors.whiteAlpha10 },
  other: { backgroundColor: Colors.scrimDark03 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 10,
  },
  info: { flex: 1, alignItems: 'flex-start' },
  name: { fontFamily: 'Almarai_700Bold', fontSize: 13, writingDirection: 'rtl', textAlign: 'left', marginBottom: 2 },
  size: { fontFamily: 'Almarai_400Regular', fontSize: 11, writingDirection: 'rtl', textAlign: 'left' },
  txtWhite: { color: Colors.white },
  txtDark: { color: Colors.text },
  txtWhiteMuted: { color: Colors.whiteAlpha70 },
  txtMuted: { color: Colors.textMuted },
  downloadBtn: { padding: 4 },
})
