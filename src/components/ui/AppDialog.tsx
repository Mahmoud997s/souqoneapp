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
  options?: DialogOption[];
  onClose?: () => void;
  onBackdropPress?: () => void;
}

// ─── Icon config per type ────────────────────────────────────────────────────

const ICON_CONFIG: Record<string, { name: string; color: string; bgColor: string; borderColor: string }> = {
  success:     { name: 'checkmark-circle-outline', color: '#16A34A', bgColor: '#F0FDF4', borderColor: '#BBF7D0' },
  error:       { name: 'close-circle-outline',     color: '#DC2626', bgColor: '#FEF2F2', borderColor: '#FECACA' },
  warning:     { name: 'alert-circle-outline',     color: '#D97706', bgColor: '#FEF3C7', borderColor: '#FDE68A' },
  info:        { name: 'information-circle-outline', color: '#0284C7', bgColor: '#F0F9FF', borderColor: '#BAE6FD' },
  confirm:     { name: 'help-circle-outline',      color: '#0B2447', bgColor: '#EEF3FF', borderColor: '#CBD5E1' },
  destructive: { name: 'trash-outline',              color: '#DC2626', bgColor: '#FEF2F2', borderColor: '#FECACA' },
  options:     { name: 'ellipsis-horizontal',     color: Colors.primary, bgColor: '#F1F5F9', borderColor: '#E2E8F0' },
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
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SH)).current;

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
            damping: 20,
            stiffness: 240,
            useNativeDriver: true,
          }),
          Animated.timing(opacAnim, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      if (isOptions) {
        Animated.timing(slideAnim, {
          toValue: SH,
          duration: 220,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 0.92, duration: 140, useNativeDriver: true }),
          Animated.timing(opacAnim,  { toValue: 0,    duration: 140, useNativeDriver: true }),
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
          <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
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
                      onClose?.();
                      opt.onPress?.();
                    }}
                  >
                    {opt.icon && (
                      <View style={[s.optionIconWrap, isDestructive && s.optionIconDestructive]}>
                        <Ionicons
                          name={opt.icon as any}
                          size={18}
                          color={isDestructive ? '#DC2626' : Colors.primary}
                        />
                      </View>
                    )}
                    <Text style={[s.optionText, isDestructive && s.optionTextDestructive]}>
                      {opt.text}
                    </Text>
                    <Ionicons name="chevron-back" size={15} color="#94A3B8" />
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
  const primaryActions = actions.filter((a) => a.style !== 'cancel');
  const cancelAction = actions.find((a) => a.style === 'cancel');
  const hasDestructive = primaryActions.some((a) => a.style === 'destructive');

  const iconConfKey = hasDestructive ? 'destructive' : type;
  const iconConf = ICON_CONFIG[iconConfKey] || ICON_CONFIG.info;

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
          <View style={[s.iconBadge, { backgroundColor: iconConf.bgColor, borderColor: iconConf.borderColor }]}>
            <Ionicons name={iconConf.name as any} size={24} color={iconConf.color} />
          </View>

          {/* Title */}
          {title && <Text style={s.dialogTitle}>{title}</Text>}

          {/* Message */}
          {message && <Text style={s.dialogMessage}>{message}</Text>}

          {/* Actions */}
          <View style={s.actionsRow}>
            {cancelAction && (
              <TouchableOpacity
                style={[s.actionBtn, s.actionBtnCancel]}
                activeOpacity={0.75}
                onPress={() => {
                  onClose?.();
                  cancelAction.onPress?.();
                }}
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
                  activeOpacity={0.75}
                  onPress={() => {
                    onClose?.();
                    action.onPress?.();
                  }}
                >
                  <Text style={s.actionBtnDestructiveTxt}>{action.text}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  key={idx}
                  style={[s.actionBtn, s.actionBtnWrap]}
                  activeOpacity={0.85}
                  onPress={() => {
                    onClose?.();
                    action.onPress?.();
                  }}
                >
                  <LinearGradient
                    colors={Gradients.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
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
    setConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const alert = React.useCallback(
    (title: string, message?: string, type: DialogType = 'info') => {
      show({
        type,
        title,
        message,
        actions: [{ text: 'حسناً', style: 'default' }],
      });
    },
    [show]
  );

  const confirm = React.useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      confirmText = 'تأكيد',
      cancelText = 'إلغاء',
      destructive = false
    ) => {
      show({
        type: 'confirm',
        title,
        message,
        actions: [
          { text: cancelText, style: 'cancel' },
          { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
        ],
      });
    },
    [show]
  );

  const showOptions = React.useCallback(
    (title: string, opts: DialogOption[]) => {
      show({ type: 'options', title, options: opts });
    },
    [show]
  );

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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // ── Centered Dialog ──
  dialogCard: {
    width: Math.min(SW * 0.82, 300),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
      },
      android: { elevation: 10 },
    }),
  },

  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  dialogTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15.5,
    lineHeight: 22,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl',
  },

  dialogMessage: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingHorizontal: 4,
    marginBottom: 16,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },

  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnWrap: {},
  actionBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  actionBtnCancel: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnCancelTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
    writingDirection: 'rtl',
  },
  actionBtnDestructive: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  actionBtnDestructiveTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    lineHeight: 18,
    color: '#DC2626',
    writingDirection: 'rtl',
  },

  // ── Bottom Sheet (Options) ──
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 10,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 20 },
    }),
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: '#1E293B',
    textAlign: 'left',
    marginBottom: 12,
    writingDirection: 'rtl',
  },
  optionsList: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  optionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDestructive: {
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  optionTextDestructive: {
    color: '#DC2626',
  },
  cancelBtn: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: '#475569',
    writingDirection: 'rtl',
  },
});
