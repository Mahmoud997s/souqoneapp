import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { Radius } from '../../../constants/radius';
import { HOW_IT_WORKS_STEPS } from '../../../constants/buses';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.55;

export function BusesHowItWorks() {
  return (
    <View style={s.container}>
      <Text style={s.headerTitle}>كيف تستفيد من القسم؟</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
      >
        {HOW_IT_WORKS_STEPS.map((step) => (
          <View key={step.id} style={[s.card, { width: CARD_WIDTH }]}>
            {/* Huge faded background number */}
            <Text style={s.bgNumber}>{step.bgNum}</Text>

            <View style={s.topRow}>
              <View style={[s.iconBox, { backgroundColor: step.bg }]}>
                <MaterialCommunityIcons name={step.icon as any} size={28} color={step.color} />
              </View>
              
              <View style={s.stepPill}>
                <Text style={s.stepPillText}>الخطوة {step.id}</Text>
              </View>
            </View>

            <View style={s.textContainer}>
              <Text style={s.title}>{step.title}</Text>
              <Text style={s.desc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: Spacing.space6,
    paddingVertical: Spacing.space2,
  },
  headerTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginBottom: Spacing.space4,
    paddingHorizontal: Spacing.space5,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space5,
    gap: 16,
    paddingBottom: 24, // extra padding for shadow
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minHeight: 190,
    justifyContent: 'space-between',
  },
  bgNumber: {
    position: 'absolute',
    right: -15,
    bottom: -25,
    fontSize: 110,
    fontFamily: 'Almarai_800ExtraBold',
    color: '#f8fafc',
    zIndex: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
    marginBottom: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepPillText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#64748b',
  },
  textContainer: {
    zIndex: 1,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  desc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: '#64748b',
    writingDirection: 'rtl',
  },
});
