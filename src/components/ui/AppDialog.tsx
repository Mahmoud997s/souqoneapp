import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import { Gradients } from '../../constants/gradients';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

export type DialogType = 'info' | 'success' | 'error' | 'warning' | 'confirm' | 'options';

export interface DialogAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
}

export interface DialogOption {
  text: string;
  icon?: string;
  onPress?: () => void;
  style?: 'default' | 'destructive';
}

interface AppDialogProps {
  visible: boolean;
  type?: DialogType;
  title?: string;
  message?: string;
  actions?: DialogAction[];
  options?: DialogOption[];       // Used with type === 'options' (bottom sheet style)
  onClose?: () => void;
  onBackdropPress?: () => void;
}

// ─── Icon config per type ────────────────────────────────────────────────────

const ICON_CONFIG: Record<DialogType, { name: string; color: string; bgColor: string }> = {
  success:  { name: 'checkmark-circle', color: Colors.success,    bgColor: '#d1fae5' },
  error:    { name: 'close-circle',     color: Colors.error,      bgColor: '#fee2e2' },
  warning:  { name: 'warning',          color: Colors.warning,    bgColor: '#fef3c7' },
  info:     { name: 'information-circle', color: Colors.primaryLight, bgColor: '#dbeafe' },
  confirm:  { name: 'help-circle',      color: Colors.accent,     bgColor: '#fff4e6' },
  options:  { name: 'ellipsis-horizontal', color: Colors.primary, bgColor: '#e8edf5' },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function AppDialog({
  visible,
  type = 'info',
  title,
  message,
  actions = [],
  options = [],
  onClose,
  onBackdropPress,
}: AppDialogProps) {
  const isOptions = type === 'options';

  // Animations
  const scaleAnim  = useRef(new Animated.Value(0.88)).current;
  const opacAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(SH)).current;  // for bottom sheet

  useEffect(() => {
    if (visible) {
      if (isOptions) {
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            damping: 18,
            stiffness: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      if (isOptions) {
        Animated.timing(slideAnim, {
          toValue: SH,
          duration: 250,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 0.88, duration: 160, useNativeDriver: true }),
          Animated.timing(opacAnim,  { toValue: 0,    duration: 160, useNativeDriver: true }),
        ]).start();
      }
    }
  }, [visible]);

  if (!visible) return null;

  // ── Options Bottom Sheet ──────────────────────────────────────────────────
  if (isOptions) {
    return (
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
        <Pressable style={s.backdrop} onPress={onBackdropPress ?? onClose}>
          <Animated.View
            style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}
          >
            {/* Drag Handle */}
            <View style={s.sheetHandle} />

            {/* Title */}
            {title && <Text style={s.sheetTitle}>{title}</Text>}

            {/* Options */}
            <View style={s.optionsList}>
              {options.map((opt, idx) => {
                const isDestructive = opt.style === 'destructive';
                const isLast = idx === options.length - 1;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[s.optionRow, !isLast && s.optionRowBorder]}
                    activeOpacity={0.7}
                    onPress={() => {
                      opt.onPress?.();
                      onClose?.();
                    }}
                  >
                    {opt.icon && (
                      <View style={[s.optionIconWrap, isDestructive && s.optionIconDestructive]}>
                        <Ionicons
                          name={opt.icon as any}
                          size={20}
                          color={isDestructive ? Colors.error : Colors.primary}
                        />
                      </View>
                    )}
                    <Text style={[s.optionText, isDestructive && s.optionTextDestructive]}>
                      {opt.text}
                    </Text>
                    <Ionicons name="chevron-back" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity style={s.cancelBtn} activeOpacity={0.8} onPress={onClose}>
              <Text style={s.cancelBtnTxt}>إلغاء</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  }

  // ── Centered Dialog ───────────────────────────────────────────────────────
  const iconConf = ICON_CONFIG[type];
  const primaryActions = actions.filter(a => a.style !== 'cancel');
  const cancelAction  = actions.find(a => a.style === 'cancel');

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onBackdropPress}>
        <Animated.View
          style={[
            s.dialogCard,
            { opacity: opacAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Icon Badge */}
          <View style={[s.iconBadge, { backgroundColor: iconConf.bgColor }]}>
            <Ionicons name={iconConf.name as any} size={36} color={iconConf.color} />
          </View>

          {/* Title */}
          {title && <Text style={s.dialogTitle}>{title}</Text>}

          {/* Message */}
          {message && <Text style={s.dialogMessage}>{message}</Text>}

          {/* Divider */}
          <View style={s.dialogDivider} />

          {/* Actions */}
          <View style={[s.actionsRow, primaryActions.length === 1 && s.actionsCol]}>
            {cancelAction && (
              <TouchableOpacity
                style={[s.actionBtn, s.actionBtnCancel]}
                activeOpacity={0.8}
                onPress={() => { cancelAction.onPress?.(); onClose?.(); }}
              >
                <Text style={s.actionBtnCancelTxt}>{cancelAction.text}</Text>
              </TouchableOpacity>
            )}
            {primaryActions.map((action, idx) => {
              const isDestructive = action.style === 'destructive';
              return isDestructive ? (
                <TouchableOpacity
                  key={idx}
                  style={[s.actionBtn, s.actionBtnDestructive]}
                  activeOpacity={0.85}
                  onPress={() => { action.onPress?.(); onClose?.(); }}
                >
                  <Text style={s.actionBtnDestructiveTxt}>{action.text}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  key={idx}
                  style={[s.actionBtn, s.actionBtnWrap]}
                  activeOpacity={0.9}
                  onPress={() => { action.onPress?.(); onClose?.(); }}
                >
                  <LinearGradient
                    colors={Gradients.button}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.actionBtnGradient}
                  >
                    <Text style={s.actionBtnPrimaryTxt}>{action.text}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Imperative API: useAppDialog ────────────────────────────────────────────

interface DialogConfig {
  type?: DialogType;
  title?: string;
  message?: string;
  actions?: DialogAction[];
  options?: DialogOption[];
}

export function useAppDialog() {
  const [config, setConfig] = React.useState<DialogConfig & { visible: boolean }>({
    visible: false,
    type: 'info',
  });

  const show = React.useCallback((cfg: DialogConfig) => {
    setConfig({ ...cfg, visible: true });
  }, []);

  const hide = React.useCallback(() => {
    setConfig(prev => ({ ...prev, visible: false }));
  }, []);

  /** Convenience: show a simple alert (replaces Alert.alert) */
  const alert = React.useCallback((title: string, message?: string, type: DialogType = 'info') => {
    show({
      type,
      title,
      message,
      actions: [{ text: 'حسناً', style: 'default' }],
    });
  }, [show]);

  /** Convenience: show a confirm dialog */
  const confirm = React.useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
  ) => {
    show({
      type: 'confirm',
      title,
      message,
      actions: [
        { text: cancelText,  style: 'cancel' },
        { text: confirmText, style: 'default', onPress: onConfirm },
      ],
    });
  }, [show]);

  /** Convenience: show an options bottom sheet (replaces Action Sheet) */
  const showOptions = React.useCallback((
    title: string,
    opts: DialogOption[],
  ) => {
    show({ type: 'options', title, options: opts });
  }, [show]);

  const dialogElement = (
    <AppDialog
      visible={config.visible}
      type={config.type}
      title={config.title}
      message={config.message}
      actions={config.actions}
      options={config.options}
      onClose={hide}
      onBackdropPress={hide}
    />
  );

  return { show, hide, alert, confirm, showOptions, dialogElement };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 27, 54, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Centered Dialog ──
  dialogCard: {
    width: SW * 0.85,
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingTop: Spacing.space5,
    paddingHorizontal: Spacing.space5,
    paddingBottom: Spacing.space4,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0B2447',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
      },
      android: { elevation: 20 },
    }),
  },

  iconBadge: {
    width: 72, height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space3,
  },

  dialogTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 19,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    writingDirection: 'rtl',
  },

  dialogMessage: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    writingDirection: 'rtl',
    paddingHorizontal: Spacing.space2,
  },

  dialogDivider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
    marginTop: Spacing.space4,
    marginBottom: Spacing.space3,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.space3,
    width: '100%',
  },
  actionsCol: {
    flexDirection: 'column',
  },

  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  actionBtnWrap: {},
  actionBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: Colors.white,
    writingDirection: 'rtl',
  },
  actionBtnCancel: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnCancelTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: Colors.text2,
    writingDirection: 'rtl',
  },
  actionBtnDestructive: {
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDestructiveTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: Colors.error,
    writingDirection: 'rtl',
  },

  // ── Bottom Sheet (Options) ──
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingTop: 12,
    paddingHorizontal: Spacing.space4,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2447',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: { elevation: 24 },
    }),
  },
  sheetHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.space4,
  },
  sheetTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: Colors.text,
    textAlign: 'left',
    marginBottom: Spacing.space3,
    writingDirection: 'rtl',
  },
  optionsList: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.space3,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space4,
    paddingVertical: 16,
    gap: Spacing.space3,
    backgroundColor: Colors.white,
  },
  optionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionIconWrap: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDestructive: {
    backgroundColor: '#fee2e2',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  optionTextDestructive: {
    color: Colors.error,
  },
  cancelBtn: {
    height: 50,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: Colors.text2,
    writingDirection: 'rtl',
  },
});
