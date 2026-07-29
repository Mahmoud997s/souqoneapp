import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useBusWizardStore } from '../../../store/busWizardStore';
import { Image } from 'expo-image';

export function BusStep6Review() {
  const { data } = useBusWizardStore();

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

  const getListingTypeLabel = () => {
    if (data.busListingType === 'BUS_SALE') return 'للبيع';
    if (data.busListingType === 'BUS_RENT') return 'تأجير';
    if (data.busListingType === 'BUS_SALE_WITH_CONTRACT') return 'بيع مع عقد تشغيل';
    return data.busListingType;
  };

  const allDisplayImages = [
    ...data.existingImages.map(img => img.url),
    ...data.images
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.pageDesc}>يرجى مراجعة تفاصيل الإعلان قبل نشره.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ملخص الإعلان</Text>
        
        {renderRow('عنوان الإعلان', data.title, 'reader-outline')}
        {renderRow('وصف الإعلان', data.description, 'document-text-outline')}
        
        <View style={styles.divider} />
        {renderRow('نوع الإعلان', getListingTypeLabel(), 'pricetag-outline')}
        {renderRow('المركبة', `${data.make} ${data.model} - ${data.year}`, 'bus-outline')}
        {renderRow('عدد المقاعد', data.capacity, 'people-outline')}
        {renderRow('الممشى', `${data.mileage} كم`, 'speedometer-outline')}
        
        <View style={styles.divider} />
        
        {data.busListingType === 'BUS_SALE' || data.busListingType === 'BUS_SALE_WITH_CONTRACT' ? (
           <>
             {renderRow('سعر البيع', `${data.price} ر.ع.`, 'cash-outline')}
             {data.isPriceNegotiable && renderRow('التفاوض', 'السعر قابل للتفاوض', 'chatbubbles-outline')}
           </>
        ) : null}

        {data.busListingType === 'BUS_RENT' ? (
           <>
             {renderRow('الإيجار اليومي', `${data.dailyPrice} ر.ع.`, 'calendar-outline')}
             {renderRow('الإيجار الشهري', `${data.monthlyPrice} ر.ع.`, 'calendar-outline')}
           </>
        ) : null}

        {data.busListingType === 'BUS_SALE_WITH_CONTRACT' ? (
           <>
             <View style={styles.divider} />
             <Text style={[styles.cardTitle, { fontSize: 14, color: Colors.textMuted }]}>العقد المرفق</Text>
             {renderRow('الجهة', data.contractClient, 'business-outline')}
             {renderRow('القيمة', `${data.contractMonthly} ر.ع. شهرياً`, 'cash-outline')}
             {renderRow('المدة', `${data.contractDuration} أشهر`, 'time-outline')}
           </>
        ) : null}

        <View style={styles.divider} />
        {renderRow('الموقع', `${data.governorate} ${data.city ? '- ' + data.city : ''}`, 'location-outline')}
        {renderRow('للتواصل', data.contactPhone, 'call-outline')}
        {renderRow('واتساب', data.whatsapp, 'logo-whatsapp')}

        <View style={styles.divider} />
        <Text style={[styles.cardTitle, { fontSize: 14, color: Colors.textMuted }]}>الصور ({allDisplayImages.length})</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
           {allDisplayImages.map((uri, i) => (
             <Image key={i} source={{ uri }} style={{ width: 60, height: 60, borderRadius: 8 }} contentFit="cover" />
           ))}
        </View>

      </View>
      
      <View style={styles.infoBanner}>
        <Ionicons name="checkmark-circle" size={24} color="#059669" />
        <Text style={styles.infoText}>سيتم مراجعة إعلانك من قبل الإدارة بعد نشره.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 16 },
  pageDesc: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: Colors.text2, textAlign: 'center', marginBottom: Spacing.space5, lineHeight: 28 },
  card: { backgroundColor: Colors.white, padding: Spacing.space4, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.space4 },
  cardTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: Colors.text, textAlign: 'left', marginBottom: 20, writingDirection: 'rtl', lineHeight: 28 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: Colors.primary + '10', alignItems: 'center', justifyContent: 'center', marginEnd: 12 },
  textWrap: { flex: 1 },
  label: { fontFamily: 'Almarai_400Regular', fontSize: 12, color: Colors.text2, textAlign: 'left', marginBottom: 4, writingDirection: 'rtl', lineHeight: 22 },
  value: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.primary, textAlign: 'left', writingDirection: 'rtl', lineHeight: 26 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: Spacing.space4, borderRadius: Radius.md, gap: 12 },
  infoText: { flex: 1, fontFamily: 'Almarai_400Regular', fontSize: 13, color: '#065F46', textAlign: 'left', lineHeight: 28, writingDirection: 'rtl' },
});
