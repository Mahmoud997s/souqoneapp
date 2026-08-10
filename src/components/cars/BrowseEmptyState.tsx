import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import { SkeletonCard } from '../ui/SkeletonCard';

interface BrowseEmptyStateProps {
  isLoading: boolean;
  isError: boolean;
  activeFiltersCount: number;
  onRetry: () => void;
  onClearAll: () => void;
}

export function BrowseEmptyState({
  isLoading,
  isError,
  activeFiltersCount,
  onRetry,
  onClearAll,
}: BrowseEmptyStateProps) {
  if (isLoading) {
    return (
      <View style={styles.skeletonGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.fullCard}>
            <SkeletonCard />
          </View>
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTxt}>حدث خطأ أثناء تحميل إعلانات السيارات</Text>
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryTxt}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.emptyState}>
      <Ionicons name="car-outline" size={64} color={Colors.borderStrong} />
      <Text style={styles.emptyTitle}>لا توجد سيارات مطابقة</Text>
      <Text style={styles.emptySubtitle}>جرب تغيير الفلاتر أو كلمة البحث للعثور على نتائج أخرى</Text>
      {activeFiltersCount > 0 && (
        <TouchableOpacity onPress={onClearAll} style={styles.clearAllBtn}>
          <Text style={styles.clearAllBtnText}>إعادة تعيين الكل</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonGrid: {
    paddingTop: Spacing.space2,
  },
  fullCard: {
    width: '100%',
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  errorTxt: {
    fontFamily: 'Almarai_700Bold',  
    fontSize: 16,
    color: Colors.error,
    marginBottom: Spacing.space4,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.space5,
    paddingVertical: Spacing.space3,
    borderRadius: Radius.lg,
  },
  retryTxt: {
    fontFamily: 'Almarai_700Bold',  
    fontSize: 15,
    color: Colors.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: Spacing.space6,
  },
  emptyTitle: {
    fontFamily: 'Almarai_800ExtraBold',  
    fontSize: 18,
    color: Colors.text,
    marginTop: Spacing.space3,
    marginBottom: Spacing.space2,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Almarai_400Regular',  
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.space4,
  },
  clearAllBtn: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  clearAllBtnText: {
    fontFamily: 'Almarai_700Bold',  
    fontSize: 14,
    color: Colors.primary,
  },
});
