import React from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { TransportRequestCard } from '../../src/components/transport/TransportRequestCard';
import { TransportRequestStatus, TransportServiceType } from '../../src/types/transport.types';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Stack } from 'expo-router';

export default function TransportPreviewScreen() {
  const mockCards = [
    {
      id: '1',
      userId: 'user1',
      serviceType: 'FURNITURE' as TransportServiceType,
      fromGovernorateId: 1,
      fromWilayaId: 1,
      toGovernorateId: 2,
      toWilayaId: 2,
      fromGovernorate: 'مسقط',
      fromCity: 'السيب',
      toGovernorate: 'الباطنة شمال',
      toCity: 'صحار',
      cargoDescription: 'نقل أثاث منزلي بالكامل',
      weightTons: 2.5,
      requiresHelper: true,
      isFlexible: false,
      budgetMin: 80,
      budgetMax: 120,
      status: 'OPEN' as TransportRequestStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quotesCount: 3,
    },
    {
      id: '2',
      userId: 'user2',
      serviceType: 'GOODS' as TransportServiceType,
      fromGovernorateId: 1,
      fromWilayaId: 1,
      toGovernorateId: 2,
      toWilayaId: 2,
      fromGovernorate: 'ظفار',
      fromCity: 'صلالة',
      toGovernorate: 'مسقط',
      cargoDescription: 'بضائع تجارية جافة',
      weightTons: 10,
      requiresHelper: false,
      isFlexible: true,
      budgetMin: 200,
      status: 'QUOTED' as TransportRequestStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quotesCount: 8,
    },
    {
      id: '3',
      userId: 'user3',
      serviceType: 'HEAVY' as TransportServiceType,
      fromGovernorateId: 1,
      fromWilayaId: 1,
      toGovernorateId: 2,
      toWilayaId: 2,
      fromGovernorate: 'الداخلية',
      fromCity: 'نزوى',
      toGovernorate: 'البريمي',
      cargoDescription: 'معدات حفر ثقيلة',
      weightTons: 25,
      requiresHelper: false,
      isFlexible: false,
      status: 'ACCEPTED' as TransportRequestStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quotesCount: 1,
    },
    {
      id: '4',
      userId: 'user4',
      serviceType: 'CONSTRUCTION' as TransportServiceType,
      fromGovernorateId: 1,
      fromWilayaId: 1,
      toGovernorateId: 2,
      toWilayaId: 2,
      fromGovernorate: 'الشرقية جنوب',
      toGovernorate: 'مسقط',
      cargoDescription: 'مواد بناء وأسمنت',
      weightTons: 15,
      requiresHelper: true,
      isFlexible: true,
      status: 'IN_PROGRESS' as TransportRequestStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quotesCount: 5,
    },
    {
      id: '5',
      userId: 'user5',
      serviceType: 'BACKLOAD' as TransportServiceType,
      fromGovernorateId: 1,
      fromWilayaId: 1,
      toGovernorateId: 2,
      toWilayaId: 2,
      fromGovernorate: 'الظاهرة',
      fromCity: 'عبري',
      toGovernorate: 'مسندم',
      toCity: 'خصب',
      cargoDescription: 'شحنة عودة فارغة',
      requiresHelper: false,
      isFlexible: true,
      budgetMax: 50,
      status: 'COMPLETED' as TransportRequestStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quotesCount: 0,
    },
    {
      id: '6',
      userId: 'user6',
      serviceType: 'EQUIPMENT' as TransportServiceType,
      fromGovernorateId: 1,
      fromWilayaId: 1,
      toGovernorateId: 2,
      toWilayaId: 2,
      fromGovernorate: 'مسقط',
      toGovernorate: 'الداخلية',
      cargoDescription: 'مولد كهربائي ضخم',
      requiresHelper: false,
      isFlexible: false,
      status: 'CANCELLED' as TransportRequestStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'معاينة كروت النقل', headerBackTitle: 'الخلف' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>بروفا كروت وتصميمات قسم النقل</Text>
          <Text style={styles.subtitle}>
            هذه الشاشة مخصصة للمعاينة فقط. تحتوي على حالات مختلفة للكروت للتأكد من المظهر والتفاعل (UI/UX).
          </Text>
        </View>

        {mockCards.map((req) => (
          <View key={req.id} style={styles.cardWrapper}>
            <Text style={styles.sectionTitle}>حالة الطلب: {req.status}</Text>
            <TransportRequestCard 
              request={req} 
              onPress={() => console.log('Card Pressed', req.id)} 
            />
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: Spacing.space4,
  },
  header: {
    marginBottom: Spacing.space4,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Almarai_800ExtraBold',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Almarai_400Regular',
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardWrapper: {
    marginBottom: Spacing.space3,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Almarai_700Bold',
    color: Colors.textMuted,
    marginBottom: 8,
    writingDirection: 'rtl',
  },
});
