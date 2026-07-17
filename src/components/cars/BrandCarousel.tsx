import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  View,
  ActivityIndicator,
} from 'react-native';
import { useBrands } from '../../hooks/useCars';
import { getBrandLogo } from '../../constants/brandLogos';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

interface BrandCarouselProps {
  selectedBrandId?: string;
  onSelectBrand: (brandId: string | undefined, brandName: string | undefined) => void;
}

export function BrandCarousel({ selectedBrandId, onSelectBrand }: BrandCarouselProps) {
  const { data: brands, isLoading } = useBrands(true); // Fetch popular brands

  if (isLoading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (!brands || brands.length === 0) return null;

  return (
    <View style={s.container}>
      <Text style={s.title}>الماركات الشائعة</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* "الكل" Option */}
        <TouchableOpacity
          style={[s.card, !selectedBrandId && s.activeCard]}
          onPress={() => onSelectBrand(undefined, undefined)}
        >
          <View style={[s.logoContainer, !selectedBrandId && s.activeLogoContainer]}>
            <Image
              source={require('../../../assets/images/icon.png')} // Fallback logo/icon
              style={s.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[s.name, !selectedBrandId && s.activeName]}>الكل</Text>
        </TouchableOpacity>

        {brands.map((brand) => {
          const isSelected = selectedBrandId === brand.id;
          const logo = getBrandLogo(brand.slug);

          return (
            <TouchableOpacity
              key={brand.id}
              style={[s.card, isSelected && s.activeCard]}
              onPress={() => onSelectBrand(brand.id, brand.nameAr || brand.name)}
            >
              <View style={[s.logoContainer, isSelected && s.activeLogoContainer]}>
                {logo ? (
                  <Image source={logo} style={s.logo} resizeMode="contain" />
                ) : (
                  <Image
                    source={require('../../../assets/images/icon.png')}
                    style={s.logo}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={[s.name, isSelected && s.activeName]} numberOfLines={1}>
                {brand.nameAr || brand.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginVertical: Spacing.space3,
  },
  title: {
    fontFamily: 'Almarai_700Bold',  fontSize: 16,
    color: Colors.text,
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space2,
    textAlign: 'right',
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    flexDirection: 'row', // Align items right-to-left
    gap: Spacing.space3,
  },
  card: {
    alignItems: 'center',
    width: 72,
  },
  activeCard: {},
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.space2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: Spacing.space1,
  },
  activeLogoContainer: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '05', // 5% opacity
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontFamily: 'Almarai_400Regular',  fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  activeName: {
    fontFamily: 'Almarai_700Bold',  color: Colors.primary,
  },
  loader: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
