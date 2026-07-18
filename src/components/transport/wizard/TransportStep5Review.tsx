import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useTransportWizardStore } from '../../../store/transportWizardStore';
import { TransportServiceType } from '../../../types/transport.types';

const SERVICE_TYPES_MAP: Record<TransportServiceType, string> = {
  GOODS: 'بضائع عامة',
  FURNITURE: 'أثاث ومنزليات',
  CONSTRUCTION: 'مواد البناء',
  HEAVY: 'شحن ثقيل',
  BACKLOAD: 'عودة فارغة',
  EQUIPMENT: 'معدات وآليات',
};

export function TransportStep5Review() {
  const { data } = useTransportWizardStore();

  const renderRow = (label: string, value: string | undefined | null, icon: any) => {
    if (!value) return null;
    return (
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color={Colors.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageDesc}>يرجى مراجعة تفاصيل الطلب قبل نشره ليتمكن الناقلون من تقديم عروضهم.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ملخص الطلب</Text>
        
        {renderRow('نوع الشحن', data.serviceType ? SERVICE_TYPES_MAP[data.serviceType as TransportServiceType] : '', 'cube-outline')}
        
        <View style={styles.divider} />
        {renderRow('من', `${data.fromGovernorate} ${data.fromCity ? '- ' + data.fromCity : ''} ${data.fromLat ? '(محدد على الخريطة 📍)' : ''}`, 'location-outline')}
        {renderRow('إلى', `${data.toGovernorate} ${data.toCity ? '- ' + data.toCity : ''} ${data.toLat ? '(محدد على الخريطة 📍)' : ''}`, 'flag-outline')}
        
        <View style={styles.divider} />
        {renderRow('تفاصيل الحمولة', data.cargoDescription, 'document-text-outline')}
        {data.weightTons && renderRow('الوزن التقريبي', `${data.weightTons} طن`, 'barbell-outline')}
        {renderRow('مساعد للتحميل', data.requiresHelper ? 'مطلوب مساعد' : 'لا أحتاج مساعد', 'people-outline')}
        
        <View style={styles.divider} />
        {data.timingType === 'asap' 
          ? renderRow('الموعد المقترح', 'في أقرب وقت ممكن (فوراً)', 'time-outline')
          : renderRow('الموعد المقترح', (data.scheduledDate && data.scheduledTime) ? `${data.scheduledDate}، ${data.scheduledTime}` : 'غير محدد', 'calendar-outline')}
        
        {data.timingType === 'scheduled' && renderRow('مرونة الموعد', data.isFlexible ? 'مرن' : 'تاريخ محدد ثابت', 'time-outline')}
        
        {(data.budgetMin || data.budgetMax) && (
          <View style={styles.divider} />
        )}
        {(data.budgetMin || data.budgetMax) && renderRow('الميزانية المقترحة', `${data.budgetMin || 0} - ${data.budgetMax || 'مفتوح'} ر.ع`, 'wallet-outline')}
        
        {data.notes && (
          <View style={styles.divider} />
        )}
        {renderRow('ملاحظات', data.notes, 'information-circle-outline')}

      </View>
      
      <View style={styles.infoBanner}>
        <Ionicons name="shield-checkmark" size={24} color="#059669" />
        <Text style={styles.infoText}>لن يتم دفع أي مبالغ الآن. ستتلقى عروض الأسعار وتختار الأنسب لك.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.text2,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: Spacing.space5,
    lineHeight: 26,
  },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.space4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.space4,
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.text,
    writingDirection: 'rtl',
    marginBottom: 20,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 12,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.text2,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginBottom: 4,
  },
  value: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.primary,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: Spacing.space4,
    borderRadius: Radius.md,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: '#065F46',
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 24,
  },
});
