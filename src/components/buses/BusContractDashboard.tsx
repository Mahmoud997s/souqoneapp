import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BUS_CONTRACT_TYPES } from '../../constants/buses';

interface BusContractDashboardProps {
  contractMonthly?: number | null;
  contractDuration?: number | null;
  contractType?: string | null;
  contractClient?: string | null;
  price?: number | null;
  withDriver?: boolean;
}

export function BusContractDashboard({
  contractMonthly,
  contractDuration,
  contractType,
  contractClient,
  price,
  withDriver,
}: BusContractDashboardProps) {
  const monthly = Number(contractMonthly || 0);
  const duration = Number(contractDuration || 0);
  const busPrice = Number(price || 0);

  const totalYield = monthly * duration;
  const annualYield = monthly * 12;
  const roiPercent = busPrice > 0 ? Math.round((annualYield / busPrice) * 100) : 0;
  const paybackMonths = monthly > 0 && busPrice > 0 ? Math.round((busPrice / monthly) * 10) / 10 : 0;
  const paybackYears = paybackMonths > 0 ? (paybackMonths / 12).toFixed(1) : '0';
  const coveragePercent = busPrice > 0 && totalYield > 0 ? Math.min(Math.round((totalYield / busPrice) * 100), 100) : 0;

  // Investment badge & Insight
  let badgeText = 'عقد ساري ودخل مستقر 🛡️';
  let badgeBg = '#FEF3C7';
  let badgeTextColor = '#B45309';
  let insightText = '💡 عقد تشغيل يضمن تشغيل الحافلة ومصاريفها بصورة مستقرة ومستمرة دون توقف.';

  if (roiPercent >= 25) {
    badgeText = 'فرصة استثمارية ممتازة 🚀';
    badgeBg = '#DCFCE7';
    badgeTextColor = '#15803D';
    insightText = `💡 هذا العقد يوفر لك استعادة رأس المال خلال فترة قياسية (${paybackYears} سنة) مع عائد سنوي ممتاز جداً.`;
  } else if (roiPercent >= 15) {
    badgeText = 'استثمار متوازن ومضمون 📈';
    badgeBg = '#EFF6FF';
    badgeTextColor = '#1D4ED8';
    insightText = '💡 فرصة ممتازة للحصول على دخل شهري مستمر يغطي الأقساط والتشغيل وتكاليف الحافلة بسهولة.';
  }

  const contractLabel = BUS_CONTRACT_TYPES.find(c => c.id === contractType)?.label || contractType;

  return (
    <View style={styles.cardContainer}>
      {/* ── CARD HEADER ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.headerIconBadge}>
            <Ionicons name="stats-chart" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2, alignItems: 'flex-start' }}>
            <Text style={styles.cardTitle}>تحليل واستثمار عقد التشغيل</Text>
            <Text style={styles.cardSub}>مؤشرات العائد المالي وجاذبية الصفقة</Text>
          </View>
        </View>
        <View style={[styles.ratingBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.ratingBadgeTxt, { color: badgeTextColor }]}>{badgeText}</Text>
        </View>
      </View>

      {/* ── HIGHLIGHTED STATS ROW (3 KPIs) ── */}
      <View style={styles.kpiRow}>
        {/* KPI 1: Annual Yield % */}
        <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
          <Ionicons name="trending-up" size={22} color="#059669" />
          <Text style={styles.kpiValueHighlight}>{roiPercent}%</Text>
          <Text style={styles.kpiLabelHighlight}>العائد السنوي (ROI)</Text>
        </View>

        {/* KPI 2: Total Contract Revenue */}
        <View style={styles.kpiCard}>
          <Ionicons name="cash-outline" size={22} color={Colors.primary} />
          <Text style={styles.kpiValue}>
            {totalYield > 0 ? Number(totalYield).toLocaleString('en-US') : '—'}{' '}
            <Text style={styles.kpiCurrency}>ر.ع</Text>
          </Text>
          <Text style={styles.kpiLabel}>إجمالي إيراد العقد</Text>
        </View>

        {/* KPI 3: Payback Period */}
        <View style={styles.kpiCard}>
          <Ionicons name="time-outline" size={22} color="#D97706" />
          <Text style={styles.kpiValue}>
            {paybackMonths > 0 ? `${paybackYears}` : '—'}{' '}
            <Text style={styles.kpiCurrency}>{paybackMonths > 0 ? 'سنة' : ''}</Text>
          </Text>
          <Text style={styles.kpiLabel}>استرداد رأس المال</Text>
        </View>
      </View>

      {/* ── COVERAGE PROGRESS BAR ── */}
      {busPrice > 0 && totalYield > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressLbl}>تغطية العقد الحالي لسعر الحافلة</Text>
            <Text style={styles.progressValTxt}>{coveragePercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${coveragePercent}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            العقد الحالي يغطي {coveragePercent}% من إجمالي ثمن الحافلة عند الشراء
          </Text>
        </View>
      )}

      {/* ── CONTRACT DETAILS LIST ── */}
      <View style={styles.detailsGrid}>
        {monthly > 0 && (
          <View style={styles.gridRow}>
            <Text style={styles.gridLbl}>الدخل الشهري</Text>
            <Text style={styles.gridValHighlight}>
              {monthly.toLocaleString('en-US')} ر.ع / شهرياً
            </Text>
          </View>
        )}

        {contractLabel ? (
          <View style={styles.gridRow}>
            <Text style={styles.gridLbl}>نوع العقد / الجهة</Text>
            <Text style={styles.gridVal}>{contractLabel}</Text>
          </View>
        ) : null}

        {contractClient ? (
          <View style={styles.gridRow}>
            <Text style={styles.gridLbl}>اسم الجهة / العميل</Text>
            <Text style={styles.gridVal}>{contractClient}</Text>
          </View>
        ) : null}

        {duration > 0 && (
          <View style={styles.gridRow}>
            <Text style={styles.gridLbl}>مدة العقد المتبقية</Text>
            <Text style={styles.gridVal}>{duration} شهر</Text>
          </View>
        )}

        {withDriver !== undefined && (
          <View style={[styles.gridRow, styles.gridRowLast]}>
            <Text style={styles.gridLbl}>خدمة السائق</Text>
            <Text style={[styles.gridVal, { color: withDriver ? '#059669' : Colors.text }]}>
              {withDriver ? 'شامل السائق' : 'بدون سائق'}
            </Text>
          </View>
        )}
      </View>

      {/* ── INSIGHT RECOMMENDATION BANNER ── */}
      <View style={styles.insightBanner}>
        <Text style={styles.insightTxt}>{insightText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: '#0F172A',
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 22,
  },
  cardSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: '#64748B',
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 16,
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ratingBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 16,
  },

  // KPI Row
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 4,
  },
  kpiCardHighlight: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  kpiValueHighlight: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 18,
    color: '#047857',
    lineHeight: 24,
  },
  kpiLabelHighlight: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    color: '#065F46',
    textAlign: 'center',
    lineHeight: 14,
  },
  kpiValue: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 22,
  },
  kpiCurrency: {
    fontSize: 10,
    fontFamily: 'Almarai_400Regular',
    color: '#64748B',
  },
  kpiLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Progress Bar
  progressContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 6,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLbl: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#334155',
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 18,
  },
  progressValTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 18,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressHint: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    color: '#64748B',
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 14,
  },

  // Details Grid
  detailsGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  gridRowLast: {
    borderBottomWidth: 0,
  },
  gridLbl: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: '#64748B',
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 20,
  },
  gridVal: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: '#0F172A',
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 20,
  },
  gridValHighlight: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: '#059669',
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 20,
  },

  // Insight Banner
  insightBanner: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  insightTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#0D9488',
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 18,
  },
});
