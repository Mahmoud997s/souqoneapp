import os

with open('app/transport/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace("  InteractionManager\n} from 'react-native';", "  InteractionManager,\n  Dimensions,\n  FlatList\n} from 'react-native';\nimport { Ionicons } from '@expo/vector-icons';\nimport { Gradients } from '../../src/constants/gradients';\nimport { CarrierCard } from '../../src/components/transport/CarrierCard';")

# 2. CarriersSwiper
SWIPER_CODE = """
const { width: SW } = Dimensions.get('window');

function CarriersSwiper({ carriers }: { carriers: any[] }) {
  const router = useRouter();
  if (!carriers || carriers.length === 0) return null;
  return (
    <View style={{ marginBottom: Spacing.space6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.space5, marginBottom: Spacing.space3 }}>
        <TouchableOpacity onPress={() => router.push('/transport/carriers' as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="chevron-back" size={16} color={Colors.primary} />
          <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.primary }}>عرض الكل</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'flex-start' }}>
          <Text style={{ fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: Colors.text }}>شركات نقل متميزة</Text>
          <Text style={{ fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 2 }}>نخبة من أفضل مزودي خدمات النقل المعتمدين</Text>
        </View>
      </View>

      <FlatList
        data={carriers}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.space5, gap: 16 }}
        snapToInterval={(SW * 0.85) + 16}
        snapToAlignment="start"
        decelerationRate="fast"
        renderItem={({ item }) => (
          <View style={{ width: SW * 0.85 }}>
            <CarrierCard
              carrier={item}
              onPress={() => router.push(/transport/carriers/ as any)}
            />
          </View>
        )}
      />
    </View>
  );
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
"""
content = content.replace("const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);", SWIPER_CODE)

# 3. Fetching Carriers Data
CARRIERS_QUERY = """  const latestRequests = useMemo(() => {
    const d = latestRes?.data as any;
    return d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
  }, [latestRes]);

  const { data: carriersRes, isLoading: loadingCarriers } = useQuery({
    queryKey: ['transport-carriers-featured'],
    queryFn: () => transportApi.getCarriers(),
    enabled: loadRest,
  });

  const featuredCarriers = useMemo(() => {
    const d = carriersRes?.data as any;
    return d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
  }, [carriersRes]);
"""
content = content.replace("""  const latestRequests = useMemo(() => {
    const d = latestRes?.data as any;
    return d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
  }, [latestRes]);""", CARRIERS_QUERY)

# 4. Insert CarriersSwiper component into JSX
JSX_INSERT = """            />
          )}

          {loadRest && !loadingCarriers && featuredCarriers.length > 0 && (
            <CarriersSwiper carriers={featuredCarriers} />
          )}

          <TransportHowItWorks />"""
content = content.replace("""            />
          )}

          <TransportHowItWorks />""", JSX_INSERT)

# 5. UI Changes (Jobs styling)
content = content.replace("colors={['#0f172a', '#1e3a8a', '#1e40af']}", "colors={Gradients.hero as any}")
content = content.replace("pointerEvents=\"auto\"", "pointerEvents=\"box-none\"")
content = content.replace("marginTop: -8,", "marginTop: -40,")
content = content.replace("color: '#f59e0b', // Amber", "color: Colors.accent,")
content = content.replace("backgroundColor: '#0f172a', alignItems: 'center'", "backgroundColor: Colors.accent, alignItems: 'center'")
content = content.replace("backgroundColor: Colors.white,\n  },\n  ctaBtnPrimaryTxt: {\n    fontFamily: 'Almarai_700Bold',  fontSize: 13, color: '#0f172a',", "backgroundColor: Colors.accent,\n  },\n  ctaBtnPrimaryTxt: {\n    fontFamily: 'Almarai_700Bold',  fontSize: 13, color: '#FFFFFF',")
content = content.replace("color=\"#0f172a\"", "color=\"#FFFFFF\"")
content = content.replace("The above content shows the entire, complete file contents of the requested file.", "")


replacements = {
  "Ø¥Ù„Ù‰ Ø£ÙŠÙ† ØªØ±ÙŠØ¯ Ø§Ù„Ù†Ù‚Ù„ØŸ": "إلى أين تريد النقل؟",
  "Ø³ÙˆÙ‚ Ø§Ù„Ù†Ù‚Ù„": "سوق النقل",
  "Ø´Ø­Ù† ÙˆÙ†Ù‚Ù„ Ù…ÙˆØ«ÙˆÙ‚ØŒ": "شحن ونقل موثوق،",
  "Ù…Ù† Ù…ÙƒØ§Ù†Ùƒ Ù„Ø£ÙŠ Ù…ÙƒØ§Ù†": "من مكانك لأي مكان",
  "Ø§Ø¨Ø­Ø« Ø¹Ù† Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø´Ø­Ù† Ø§Ù„Ù…ØªØ§Ø­Ø©...": "ابحث عن طلبات الشحن المتاحة...",
  "Ø£Ù†Ø´Ø¦ Ø·Ù„Ø¨ Ù†Ù‚Ù„": "أنشئ طلب نقل",
  "ØªØµÙ Ø­ Ø§Ù„Ø·Ù„Ø¨Ø§Øª": "تصفح الطلبات",
  "Ø£Ø­Ø¯Ø« Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù†Ù‚Ù„": "أحدث طلبات النقل",
  "ØªØµÙ Ø­ Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…Ù ØªÙˆØ­Ø© ÙˆÙ‚Ø¯Ù… Ø¹Ø±Ø¶Ùƒ": "تصفح الطلبات المفتوحة وقدم عرضك",
  "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ù†Ù‚Ù„ Ø­Ø§Ù„ÙŠØ§Ù‹": "لا توجد طلبات نقل حالياً",
  "Ø¹Ø±Ø¶ Ø§Ù„ÙƒÙ„": "عرض الكل",
  "Ø´Ø±ÙƒØ§Øª Ù†Ù‚Ù„ Ù…ØªÙ…ÙŠØ²Ø©": "شركات نقل متميزة",
  "Ù†Ø®Ø¨Ø© Ù…Ù† Ø£Ù Ø¶Ù„ Ù…Ø²ÙˆØ¯ÙŠ Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù†Ù‚Ù„ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ÙŠÙ†": "نخبة من أفضل مزودي خدمات النقل المعتمدين",
  "Ø§Ù„Ù†Ø§Ù‚Ù„ÙŠÙ†": "الناقلين",
}

for k, v in replacements.items():
    content = content.replace(k, v)

# Fix comments
content = content.replace("â”€â”€", "──")
content = content.replace("â• â• ", "══")

with open('app/transport/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updates applied successfully.")
