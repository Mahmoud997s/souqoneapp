import React, { useEffect } from 'react'
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useToastStore, type ActionSheetOption } from '../../store/toastStore'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { TopBarGlassSurface } from './TopBarGlassSurface'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

export interface GlassActionSheetProps {
  visible: boolean
  title?: string
  options: ActionSheetOption[]
  cancelLabel?: string
  onClose: () => void
  testID?: string
}

export function GlassActionSheet({
  visible,
  title,
  options,
  cancelLabel = 'إلغاء',
  onClose,
  testID = 'glass-action-sheet',
}: GlassActionSheetProps) {
  const insets = useSafeAreaInsets()
  const hasActiveDecision = useToastStore((s) => Boolean(s.activeDecision))

  useEffect(() => {
    if (!visible || hasActiveDecision) return
    const sub = BackHandler?.addEventListener?.('hardwareBackPress', () => {
      onClose()
      return true
    })
    return () => {
      sub?.remove?.()
    }
  }, [hasActiveDecision, onClose, visible])

  if (!visible) {
    return null
  }

  const handleOptionPress = (option: ActionSheetOption) => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {
      // Ignore haptics errors on unsupported devices/environments
    }
    onClose()
    option.onPress?.()
  }

  const handleCancelPress = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {
      // Ignore haptics errors on unsupported devices/environments
    }
    onClose()
  }

  return (
    <View
      testID={`${testID}-overlay`}
      accessibilityViewIsModal
      style={s.overlay}
      pointerEvents="box-none"
    >
      <Pressable
        testID={`${testID}-scrim`}
        style={s.scrim}
        onPress={handleCancelPress}
        accessibilityLabel="إغلاق القائمة"
      />

      <View
        testID={testID}
        style={[
          s.sheet,
          { paddingBottom: Math.max(insets.bottom, Spacing.space4) },
        ]}
      >
        <TopBarGlassSurface
          testID={`${testID}-glass`}
          kind="ice-control"
          borderRadius={Radius.xl}
          style={s.sheetGlassCorners}
        />
        <View pointerEvents="none" style={s.sheetInnerHighlight} />

        <View style={s.handleBar} />

        {Boolean(title) && (
          <Text testID={`${testID}-title`} style={s.title} numberOfLines={2}>
            {title}
          </Text>
        )}

        <View style={s.optionsList}>
          {options.map((opt, idx) => {
            const isDestructive = opt.style === 'destructive'
            const surfaceTestID = `${testID}-row-${idx}-glass`
            return (
              <TouchableOpacity
                key={`${opt.text}-${idx}`}
                testID={opt.testID ?? `${testID}-option-${idx}`}
                accessibilityRole="button"
                accessibilityLabel={opt.text}
                activeOpacity={0.78}
                onPress={() => handleOptionPress(opt)}
                style={[
                  s.rowBtn,
                  isDestructive ? s.rowBtnDestructive : s.rowBtnDefault,
                ]}
              >
                <TopBarGlassSurface
                  testID={surfaceTestID}
                  kind="ice-control"
                  borderRadius={Radius.md}
                />
                {isDestructive && (
                  <View pointerEvents="none" style={s.rowTintDestructive} />
                )}
                {Boolean(opt.icon) && (
                  <Ionicons
                    name={opt.icon as IoniconName}
                    size={19}
                    color={isDestructive ? Colors.error : Colors.primary}
                  />
                )}
                <Text
                  style={[
                    s.rowTxt,
                    isDestructive ? s.rowTxtDestructive : s.rowTxtDefault,
                  ]}
                  numberOfLines={2}
                >
                  {opt.text}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity
          testID={`${testID}-cancel-btn`}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          activeOpacity={0.78}
          onPress={handleCancelPress}
          style={[s.rowBtn, s.cancelBtn]}
        >
          <TopBarGlassSurface
            testID={`${testID}-cancel-glass`}
            kind="ice-control"
            borderRadius={Radius.md}
          />
          <View pointerEvents="none" style={s.cancelTint} />
          <Text style={s.cancelTxt} numberOfLines={1}>
            {cancelLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export function GlassActionSheetHost() {
  const activeSheet = useToastStore((s) => s.activeSheet)
  const hideActionSheet = useToastStore((s) => s.hideActionSheet)

  if (!activeSheet) {
    return null
  }

  return (
    <GlassActionSheet
      visible
      title={activeSheet.title}
      options={activeSheet.options}
      cancelLabel={activeSheet.cancelLabel}
      onClose={() => hideActionSheet(true)}
    />
  )
}

const s = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 99998,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.scrimDark35,
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.transparent,
    borderTopWidth: 0.5,
    borderColor: Colors.whiteAlpha75,
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    ...Shadows.card2,
  },
  sheetGlassCorners: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sheetInnerHighlight: {
    position: 'absolute',
    top: 0,
    left: Spacing.space5,
    right: Spacing.space5,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.whiteAlpha75,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.slateBorderStrong,
    alignSelf: 'center',
    marginBottom: Spacing.space3,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space3,
  },
  optionsList: {
    gap: Spacing.space2,
  },
  rowBtn: {
    minHeight: 48,
    borderRadius: Radius.md,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    gap: Spacing.space3,
    borderWidth: 0.5,
    backgroundColor: Colors.transparent,
  },
  rowBtnDefault: {
    borderColor: Colors.slateBorder,
  },
  rowBtnDestructive: {
    borderColor: Colors.errorBorder40,
  },
  rowTintDestructive: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.errorSoft10,
  },
  rowTxt: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  rowTxtDefault: {
    color: Colors.text,
  },
  rowTxtDestructive: {
    color: Colors.error,
  },
  cancelBtn: {
    marginTop: Spacing.space3,
    justifyContent: 'center',
    borderColor: Colors.primarySoft30,
  },
  cancelTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primarySoft12,
  },
  cancelTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primaryDeep,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
})
