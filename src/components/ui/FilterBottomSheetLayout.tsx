import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import { FilterGlassTokens } from '../../constants/filterGlassTokens';
import { TopBarTokens } from '../../constants/topBarTokens';
import { FilterGlassSurface } from './FilterGlassSurface';
import { ModalToastHost } from './ModalToastHost';
import { ResetFilterButton } from './ResetFilterButton';
import { formatNumberWestern } from '../../utils/numberFormat';

export const FILTER_SHEET_DEFAULT_TITLE = 'تصفية النتائج';

/**
 * Shared apply-button label and disabled rule across all filter sheets (D-381).
 * - When `resultsCount` is known: "عرض <N> نتيجة", disabled when `resultsCount === 0`.
 * - When `resultsCount` is undefined: "تطبيق الفلتر", enabled.
 */
export function getFilterSheetApplyState(resultsCount?: number): {
  label: string;
  disabled: boolean;
} {
  if (resultsCount !== undefined) {
    return {
      label: `عرض ${formatNumberWestern(resultsCount)} نتيجة`,
      disabled: resultsCount === 0,
    };
  }
  return {
    label: 'تطبيق الفلتر',
    disabled: false,
  };
}

interface FilterBottomSheetLayoutProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  hasActiveFilters: boolean;
  onClear: () => void;
  onApply: () => void;
  applyLabel?: string;
  resultsCount?: number;
  applyDisabled?: boolean;
  children: React.ReactNode;
  useKeyboardAvoiding?: boolean;
  isNested?: boolean;
  onBack?: () => void;
}

export function FilterBottomSheetLayout({
  visible,
  onClose,
  title = FILTER_SHEET_DEFAULT_TITLE,
  hasActiveFilters,
  onClear,
  onApply,
  applyLabel,
  resultsCount,
  applyDisabled,
  children,
  useKeyboardAvoiding = true,
  isNested = false,
  onBack,
}: FilterBottomSheetLayoutProps) {
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const computedApply = getFilterSheetApplyState(resultsCount);
  const resolvedApplyLabel = applyLabel ?? computedApply.label;
  const isApplyDisabled = applyDisabled ?? computedApply.disabled;

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardVisible(true);
      if (Platform.OS === 'android') {
        setKeyboardHeight(e.endCoordinates.height);
      }
    });
    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      if (Platform.OS === 'android') {
        setKeyboardHeight(0);
      }
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const content = (
    <View style={[s.sheet, Platform.OS === 'android' && isKeyboardVisible ? { paddingBottom: keyboardHeight } : {}]}>
      <FilterGlassSurface
        testID="filter-sheet-glass"
        style={s.sheetGlassLayer}
      />
      <View style={s.dragHandle} />

      {/* Header */}
      <View style={s.header}>
        <View testID="filter-sheet-header-start" style={[s.headerSide, s.headerSideStart]}>
          {isNested ? (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.glassCircle}>
              <Ionicons name="arrow-forward-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.glassCircle}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <Text testID="filter-sheet-title" style={s.title} numberOfLines={1}>{title}</Text>

        <View testID="filter-sheet-header-end" style={[s.headerSide, s.headerSideEnd]}>
          {hasActiveFilters ? (
            <ResetFilterButton onPress={onClear} />
          ) : null}
        </View>
      </View>

      {/* Body */}
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      <View style={[
        s.footer, 
        { paddingBottom: isKeyboardVisible ? 9 : (insets.bottom > 0 ? insets.bottom : Spacing.space3) }
      ]}>
        <TouchableOpacity
          testID="filter-sheet-apply-btn"
          style={[s.applyBtn, isApplyDisabled && s.applyBtnDisabled]}
          onPress={onApply}
          disabled={isApplyDisabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: isApplyDisabled }}
          activeOpacity={0.8}
        >
          <Text style={[s.applyBtnText, isApplyDisabled && s.applyBtnTextDisabled]}>{resolvedApplyLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      {useKeyboardAvoiding && Platform.OS === 'ios' ? (
        <KeyboardAvoidingView
          behavior="padding"
          style={s.overlay}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={s.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
          {content}
        </View>
      )}
      {visible && <ModalToastHost />}
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: FilterGlassTokens.sheet.bottomSheetOverlayBg,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '75%',
    backgroundColor: FilterGlassTokens.sheet.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 0,
    paddingTop: Spacing.space3,
    shadowColor: Colors.shadowBlack,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetGlassLayer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerSide: {
    width: 80,
    justifyContent: 'center',
  },
  headerSideStart: {
    alignItems: 'flex-start',
  },
  headerSideEnd: {
    alignItems: 'flex-end',
  },
  glassCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FilterGlassTokens.iceGlassBg,
    borderWidth: 1,
    borderColor: FilterGlassTokens.borderColor,
    ...TopBarTokens.buttonShadow,
  },
  title: {
    flex: 1,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 9,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  applyBtn: {
    backgroundColor: Colors.primaryStrong,
    paddingVertical: 11,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  applyBtnDisabled: {
    backgroundColor: Colors.slateBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  applyBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.white,
    includeFontPadding: false,
    writingDirection: 'rtl',
  },
  applyBtnTextDisabled: {
    color: Colors.textMuted,
  },
});
