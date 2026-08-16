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
import { ResetFilterButton } from './ResetFilterButton';

interface FilterBottomSheetLayoutProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  hasActiveFilters: boolean;
  onClear: () => void;
  onApply: () => void;
  applyLabel?: string;
  children: React.ReactNode;
  useKeyboardAvoiding?: boolean;
  isNested?: boolean;
  onBack?: () => void;
}

export function FilterBottomSheetLayout({
  visible,
  onClose,
  title,
  hasActiveFilters,
  onClear,
  onApply,
  applyLabel = 'تطبيق الفلتر',
  children,
  useKeyboardAvoiding = true,
  isNested = false,
  onBack,
}: FilterBottomSheetLayoutProps) {
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

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
      <View style={s.dragHandle} />

      {/* Header */}
      <View style={s.header}>
        {isNested ? (
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={s.glassCircle}>
            <Ionicons name="arrow-forward-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.glassCircle}>
            <Ionicons name="close" size={20} color={Colors.text} />
          </TouchableOpacity>
        )}

        <Text style={s.title}>{title}</Text>

        {hasActiveFilters ? (
          <ResetFilterButton onPress={onClear} />
        ) : (
          <View style={{ width: 80 }} />
        )}
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
        <TouchableOpacity style={s.applyBtn} onPress={onApply} activeOpacity={0.8}>
          <Text style={s.applyBtnText}>{applyLabel}</Text>
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
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '75%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.space3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
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
    borderBottomColor: '#F1F5F9',
  },
  glassCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
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
    backgroundColor: Colors.primary,
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
  applyBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.white,
    includeFontPadding: false,
    writingDirection: 'rtl',
  },
});
