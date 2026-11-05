import React, { useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Platform,
  Share,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import * as CardSystemModule from '../../constants/cardSystem'
import { CardSystem } from '../../constants/cardSystem'
import { useAuthStore } from '../../store/authStore'
import { useFavoriteToggle } from '../../features/favorites/useFavoriteToggle'
import { favoriteTypeForCard } from '../../features/favorites/favoriteEntityTypes'
import { formatDate } from '../../utils/format'
import { resolveListingLocation } from '../../utils/listingLocation'
import { isOwnListing } from '../../utils/isOwnListing'
import { CardImageSwiper } from './CardImageSwiper'
import { VerifiedBadge } from './VerifiedBadge'
import { GlassSurface, useGlassSupport, type GlassSupport } from '../navigation/glassSupport'
import { areListingCardBasePropsEqual } from '../../utils/cardMemoComparison'

export interface ListingCardPill {
  key: string
  label: string
  iconName?: string
  iconFamily?: 'Ionicons' | 'MaterialCommunityIcons'
  variant?: 'neutral' | 'blue' | 'amber' | 'green' | 'red' | 'orange'
  textColor?: string
}

export interface ListingCardBadge {
  key: string
  label: string
  backgroundColor: string
  textColor?: string
  iconName?: string
  borderColor?: string
}

export interface ListingCardBaseProps {
  item: any
  title: string
  priceLabel: string
  isPriceNegotiable?: boolean
  location?: string
  onPress: () => void
  displayImages?: string[]
  imageCount?: number
  placeholderIcon?: keyof typeof Ionicons.glyphMap
  pills?: ListingCardPill[]
  badges?: ListingCardBadge[]
  customBadges?: React.ReactNode
  maxChips?: number
  isSellerVerified?: boolean
  isSold?: boolean
  status?: string
  fullWidth?: boolean
  gridMode?: boolean
  actionMenu?: React.ReactNode
  cardActions?: React.ReactNode
  disableImageSwipe?: boolean
  shareMessage?: string
  titleNumberOfLines?: number
  imageHeight?: number
  compactBody?: boolean
  favoriteType?: string
  /** Notification callback fired AFTER the toggle pipeline executes. MUST NEVER perform the API call. */
  onFavorite?: (isFav: boolean) => void
  liquidGlass?: boolean
  pillNativeGlass?: boolean
  glassSupport?: GlassSupport
  initialCardWidth?: number
  style?: StyleProp<ViewStyle>
}

interface CardPillGlassLayerProps {
  testID: string
  nativeGlass: boolean
  isNegotiable?: boolean
  support: GlassSupport
}

function CardPillGlassLayer({
  testID,
  nativeGlass,
  isNegotiable = false,
  support,
}: CardPillGlassLayerProps) {
  if (nativeGlass) {
    return (
      <GlassSurface
        testID={testID}
        variant="capsule"
        borderRadius={CardSystem.glass.capsuleRadius}
        tintOverlayColor={isNegotiable ? CardSystem.glass.negotiableTint : undefined}
        noBorder={true}
        support={support}
      />
    )
  }

  return (
    <View
      testID={`${testID}-layered-wash`}
      pointerEvents="none"
      style={[
        s.pillLayeredWash,
        isNegotiable && s.pillLayeredWashNegotiable,
      ]}
    >
      <View
        testID={`${testID}-top-highlight`}
        style={s.pillTopHighlight}
      />
    </View>
  )
}

export function computeInitialCardWidth(
  fullWidth: boolean = false,
  initialCardWidth?: number
): number {
  if (typeof initialCardWidth === 'number' && initialCardWidth > 0) {
    return initialCardWidth
  }
  const windowWidth = Dimensions.get('window').width || 390
  if (fullWidth) {
    // Browse lists use paddingHorizontal: Spacing.space4 (16 * 2 = 32px) + card 1px border on each side (2px)
    return Math.max(0, windowWidth - 34)
  }
  // Horizontal carousel cards use width: Dimensions.get('window').width * 0.6 + 1px border on each side (2px)
  return Math.max(0, Math.round(windowWidth * 0.6) - 2)
}

const ListingCardBaseComponent = ({
  item,
  title,
  priceLabel,
  isPriceNegotiable = false,
  location,
  onPress,
  displayImages = [],
  imageCount,
  placeholderIcon = 'car-sport',
  pills = [],
  badges = [],
  customBadges,
  maxChips = 3,
  isSellerVerified = false,
  isSold = false,
  status = 'ACTIVE',
  fullWidth = false,
  gridMode = false,
  actionMenu,
  cardActions,
  disableImageSwipe = false,
  shareMessage,
  titleNumberOfLines = 1,
  imageHeight,
  compactBody = false,
  favoriteType,
  onFavorite,
  liquidGlass = true,
  pillNativeGlass,
  glassSupport,
  initialCardWidth,
  style,
}: ListingCardBaseProps) => {
  const effectivePillNativeGlass =
    pillNativeGlass ?? CardSystemModule.CARD_PILL_NATIVE_GLASS
  const router = useRouter()
  const { user } = useAuthStore()
  const hookGlass = useGlassSupport(Boolean(liquidGlass && !glassSupport))
  const glass = glassSupport ?? hookGlass
  const isOwner = isOwnListing(item, user?.id)
  const resolvedType = favoriteTypeForCard(item, favoriteType)
  const targetId = item?.id || item?.raw?.id
  const { isFavorite: isFav, toggle: toggleFavorite } = useFavoriteToggle(
    resolvedType,
    targetId,
    Boolean(item?.isFavorite),
    { title }
  )

  const handleFavorite = () => {
    if (isOwner) return
    toggleFavorite()
    onFavorite?.(!isFav)
  }
  const [cardWidth, setCardWidth] = useState(() =>
    computeInitialCardWidth(fullWidth, initialCardWidth)
  )

  const handleImageContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const measuredWidth = e.nativeEvent.layout.width
    if (measuredWidth > 0) {
      setCardWidth((prev) => (Math.abs(measuredWidth - prev) > 0.5 ? measuredWidth : prev))
    }
  }, [])

  const resolvedLocation = location !== undefined ? location : resolveListingLocation(item)
  const rawStatus = status || item?.status || 'ACTIVE'
  const isActuallySold = isSold || rawStatus === 'SOLD'

  const effectiveImageCount =
    imageCount ??
    item?.imageCount ??
    item?.raw?.imageCount ??
    item?.raw?._count?.images ??
    (displayImages.length > 0 ? displayImages.length : undefined)



  const handleShare = async () => {
    try {
      await Share.share({
        message:
          shareMessage ||
          `شاهد هذا الإعلان على سوق ون: ${title}\nالسعر: ${priceLabel}\nhttps://souqone.app/listings/${item.id}`,
      })
    } catch {
      // User dismissed share sheet or platform error
    }
  }

  const imageContainerHeight = imageHeight
    ? imageHeight
    : fullWidth
    ? CardSystem.fullWidthHeight
    : CardSystem.aspectRatioHeight

  return (
    <View
      testID="listing-card-root"
      style={[
        s.card,
        liquidGlass && s.cardLiquidGlass,
        fullWidth && s.cardFullWidth,
        gridMode && s.cardGridMode,
        style,
      ]}
    >
      {liquidGlass && (
        <GlassSurface
          testID="listing-card-surface"
          borderRadius={CardSystem.radius.outer}
          glassEffectStyle="clear"
          tintOverlayColor={CardSystem.glass.cardTint}
          noBorder={true}
          support={glass}
        />
      )}
      {/* ── IMAGE SECTION ── */}
      <View
        testID="listing-card-image-container"
        style={[
          s.imageContainer,
          imageHeight
            ? { height: imageHeight, aspectRatio: undefined }
            : fullWidth
            ? s.imageContainerFullWidth
            : s.imageContainerAspect,
        ]}
        onLayout={handleImageContainerLayout}
      >
        {displayImages.length > 0 ? (
          <CardImageSwiper
            images={displayImages}
            imageCount={effectiveImageCount}
            cardWidth={cardWidth}
            imageHeight={imageHeight}
            fullWidth={fullWidth}
            disableImageSwipe={disableImageSwipe}
            onPress={onPress}
          />
        ) : (
          <Pressable
            onPress={onPress}
            style={[
              s.imagePlaceholder,
              imageHeight
                ? { height: imageHeight, aspectRatio: undefined }
                : fullWidth
                ? s.imageContainerFullWidth
                : undefined,
            ]}
          >
            <Ionicons
              name={placeholderIcon}
              size={40}
              color={Colors.borderStrong}
            />
          </Pressable>
        )}

        {/* Action Buttons (Share & Favorite) */}
        <View style={s.actionsContainer}>
          <TouchableOpacity
            testID="listing-card-share"
            style={[s.actionBtn, liquidGlass && s.actionBtnGlass]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons
              name={liquidGlass ? 'share-social-outline' : 'share-social'}
              size={15}
              color={liquidGlass ? Colors.primary : Colors.white}
            />
          </TouchableOpacity>
          {resolvedType !== null && !isOwner && (
            <TouchableOpacity
              style={[s.actionBtn, liquidGlass && s.actionBtnGlass]}
              testID="listing-card-favorite"
              onPress={handleFavorite}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={16}
                color={isFav ? Colors.error : liquidGlass ? Colors.primary : Colors.white}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Sold Visual Overlay */}
        {isActuallySold && (
          <View style={[StyleSheet.absoluteFill, s.soldOverlay]}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={s.soldRibbon}>
              <Text style={s.soldRibbonText}>مباع</Text>
            </View>
          </View>
        )}

        {/* Badges Overlay */}
        <View style={s.badgesContainer}>
          {rawStatus === 'SOLD' && (
            <View style={[s.badge, { backgroundColor: Colors.error }]}>
              <Text style={[s.badgeTxt, { color: Colors.white }]}>مباع</Text>
            </View>
          )}
          {rawStatus === 'ARCHIVED' && (
            <View style={[s.badge, { backgroundColor: Colors.textMuted }]}>
              <Text style={[s.badgeTxt, { color: Colors.white }]}>مؤرشف</Text>
            </View>
          )}
          {rawStatus === 'SUSPENDED' && (
            <View style={[s.badge, { backgroundColor: Colors.warning }]}>
              <Text style={[s.badgeTxt, { color: Colors.white }]}>معلق</Text>
            </View>
          )}

          {badges.map((b) => (
            <View
              key={b.key}
              style={[
                s.badge,
                { backgroundColor: b.backgroundColor },
                b.borderColor && { borderWidth: 1, borderColor: b.borderColor },
              ]}
            >
              {b.iconName && (
                <Ionicons
                  name={b.iconName as keyof typeof Ionicons.glyphMap}
                  size={10}
                  color={b.textColor || Colors.white}
                  style={s.badgeIcon}
                />
              )}
              <Text style={[s.badgeTxt, { color: b.textColor || Colors.white }]}>
                {b.label}
              </Text>
            </View>
          ))}

          {customBadges}
        </View>

        {/* Optional Action Menu */}
        {actionMenu && <View style={s.actionMenuContainer}>{actionMenu}</View>}
      </View>

      {/* ── DETAILS SECTION ── */}
      <Pressable
        testID="listing-card-details"
        onPress={onPress}
        style={[
          s.cardDetails,
          compactBody && s.cardDetailsCompact,
        ]}
      >
        <View style={s.headerRow}>
          <Text
            style={[s.cardTitle, { flex: 1 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {isSellerVerified && (
            <VerifiedBadge size={17} style={{ marginTop: 2 }} />
          )}
        </View>

        <View style={[s.locationRow, compactBody && s.locationRowCompact]}>
          <View style={s.locationInner}>
            <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
            <Text style={s.locationTxt} numberOfLines={1}>
              {resolvedLocation}
            </Text>
          </View>
          {!!item?.createdAt && (
            <>
              <Text style={s.dotSeparator}>•</Text>
              <View style={s.timeInner}>
                <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                <Text style={s.timeTxt}>{formatDate(item.createdAt)}</Text>
              </View>
            </>
          )}
        </View>

        <View style={[s.divider, compactBody && s.dividerCompact, liquidGlass && s.dividerGlass]} />

        {/* Details Pills List */}
        <View style={s.detailsList}>
          {(() => {
            if (!pills || pills.length === 0) return null
            const visiblePills = pills.slice(0, maxChips)
            const remainingCount = pills.length - maxChips

            return (
              <>
                {visiblePills.map((pill) => {
                  const pillBgStyle = s.pillNeutral
                  const defaultTextColor = Colors.text2
                  const textColor = pill.textColor || defaultTextColor

                  return (
                    <View
                      key={pill.key}
                      testID={`listing-card-pill-wrap-${pill.key}`}
                      style={[
                        s.detailPill,
                        liquidGlass ? s.pillGlass : pillBgStyle,
                      ]}
                    >
                      {liquidGlass && (
                        <CardPillGlassLayer
                          testID={`listing-card-pill-${pill.key}`}
                          nativeGlass={effectivePillNativeGlass}
                          support={glass}
                        />
                      )}
                      {pill.iconFamily === 'MaterialCommunityIcons' ? (
                        <MaterialCommunityIcons
                          name={pill.iconName as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={12}
                          color={textColor}
                        />
                      ) : pill.iconName ? (
                        <Ionicons
                          name={pill.iconName as keyof typeof Ionicons.glyphMap}
                          size={13}
                          color={textColor}
                        />
                      ) : null}
                      <Text
                        style={[s.detailText, { color: textColor }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {pill.label}
                      </Text>
                    </View>
                  )
                })}
                {remainingCount > 0 && (
                  <View
                    testID="listing-card-pill-wrap-remaining"
                    style={[
                      s.detailPill,
                      liquidGlass ? s.pillGlass : s.pillNeutral,
                      s.remainingPill,
                    ]}
                  >
                    {liquidGlass && (
                      <CardPillGlassLayer
                        testID="listing-card-pill-remaining"
                        nativeGlass={effectivePillNativeGlass}
                        support={glass}
                      />
                    )}
                    <Text style={s.remainingText} numberOfLines={1}>
                      +{remainingCount}
                    </Text>
                  </View>
                )}
              </>
            )
          })()}
        </View>

        <View style={[s.footerDivider, compactBody && s.footerDividerCompact, liquidGlass && s.dividerGlass]} />

        {/* Footer Row (Negotiable in flex:1 & Price in responsive compact slot) */}
        <View style={s.footerRow}>
          {isPriceNegotiable ? (
            <View
              testID="listing-card-negotiable-pill-wrap"
              style={[
                s.footerPill,
                liquidGlass ? [s.pillGlass, s.pillGlassNegotiable] : s.pillGreen,
                s.footerNegotiablePill,
              ]}
            >
              {liquidGlass && (
                <CardPillGlassLayer
                  testID="listing-card-negotiable-pill"
                  nativeGlass={effectivePillNativeGlass}
                  isNegotiable={true}
                  support={glass}
                />
              )}
              <Text
                numberOfLines={1}
                style={s.negotiableText}
              >
                قابل للتفاوض
              </Text>
            </View>
          ) : (
            <View style={s.footerNegotiableSpacer} pointerEvents="none" />
          )}

          <View
            testID="listing-card-price-pill-wrap"
            style={[
              s.footerPill,
              liquidGlass
                ? [s.pillGlass, isPriceNegotiable && s.pillGlassNegotiable]
                : isPriceNegotiable
                ? s.pillGreen
                : s.pillNeutral,
              s.footerPricePillCompact,
            ]}
          >
            {liquidGlass && (
              <CardPillGlassLayer
                testID="listing-card-price-pill"
                nativeGlass={effectivePillNativeGlass}
                isNegotiable={isPriceNegotiable}
                support={glass}
              />
            )}
            <Ionicons
              name="wallet-outline"
              size={14}
              color={isPriceNegotiable ? Colors.primary : Colors.text2}
            />
            <Text
              numberOfLines={1}
              style={[
                s.budgetValText,
                isPriceNegotiable && { color: Colors.primary },
              ]}
            >
              {priceLabel}
            </Text>
          </View>
        </View>

        {cardActions && (
          <View style={s.cardActionsRow}>
            {cardActions}
          </View>
        )}
      </Pressable>
    </View>
  )
}

export const ListingCardBase = React.memo(
  ListingCardBaseComponent,
  areListingCardBasePropsEqual
)

const s = StyleSheet.create({
  card: {
    width: Dimensions.get('window').width * 0.6,
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    alignSelf: 'flex-start',
    ...CardSystem.styles.border,
    overflow: 'hidden',
    ...CardSystem.styles.softShadow,
  },
  cardLiquidGlass: {
    backgroundColor: 'transparent',
    borderColor: CardSystem.glass.cardBorderColor,
  },
  cardFullWidth: {
    width: '100%',
  },
  cardGridMode: {
    width: '100%',
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
  },
  imageContainerFullWidth: {
    height: CardSystem.fullWidthHeight,
    aspectRatio: undefined,
  },
  imageContainerAspect: {
    height: CardSystem.aspectRatioHeight,
    aspectRatio: undefined,
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: CardSystem.aspectRatioHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperScrollView: {
    width: '100%',
    height: CardSystem.aspectRatioHeight,
  },
  dotsWrapper: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: Colors.white,
    width: 14,
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    zIndex: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageCountText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: 'Almarai_700Bold',
    lineHeight: 16,
  },
  actionsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnGlass: {
    backgroundColor: CardSystem.glass.actionBtnBg,
    borderWidth: 1,
    borderColor: CardSystem.glass.actionBtnBorderColor,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  soldOverlay: {
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  soldRibbon: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 32,
    transform: [{ rotate: '-12deg' }],
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  soldRibbonText: {
    color: Colors.white,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    letterSpacing: 1,
  },
  badgesContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 75,
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: CardSystem.radius.badge,
    ...CardSystem.styles.badgeShadow,
  },
  badgeIcon: {
    marginRight: 2,
  },
  badgeTxt: {
    ...CardSystem.typography.badgeText,
    color: Colors.white,
    writingDirection: 'rtl',
  },
  actionMenuContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    zIndex: 30,
    elevation: 6,
  },
  cardDetails: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  cardDetailsCompact: {
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: CardSystem.gap.primary,
  },
  cardTitle: {
    ...CardSystem.typography.title,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    marginTop: 2,
    marginBottom: 5,
  },
  locationRowCompact: {
    marginTop: 2,
    marginBottom: 4,
  },
  locationInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  locationTxt: {
    ...CardSystem.typography.subtitle,
    color: Colors.textMuted,
    marginStart: 4,
    writingDirection: 'rtl',
  },
  dotSeparator: {
    fontSize: 11,
    color: Colors.border,
  },
  timeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  timeTxt: {
    ...CardSystem.typography.subtitle,
    color: Colors.textMuted,
    marginStart: 3,
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.inputBg,
    marginBottom: 6,
  },
  dividerCompact: {
    marginBottom: 5,
  },
  dividerGlass: {
    backgroundColor: CardSystem.glass.dividerColor,
  },
  footerDivider: {
    height: 1,
    backgroundColor: Colors.inputBg,
    marginTop: 2,
    marginBottom: 6,
  },
  footerDividerCompact: {
    marginTop: 1,
    marginBottom: 5,
  },
  detailsList: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 3.5,
    marginBottom: 4,
    overflow: 'hidden',
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: CardSystem.radius.inner,
    flexShrink: 1,
  },
  pillGlass: {
    backgroundColor: 'transparent',
    borderRadius: CardSystem.glass.capsuleRadius,
    borderWidth: 1,
    borderColor: CardSystem.glass.capsuleBorderColor,
    overflow: 'hidden',
  },
  pillGlassNegotiable: {
    borderColor: CardSystem.glass.negotiableBorderColor,
  },
  pillLayeredWash: {
    ...StyleSheet.absoluteFill,
    borderRadius: CardSystem.glass.capsuleRadius,
    backgroundColor: CardSystem.glass.capsuleBlurWashBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CardSystem.glass.capsuleBorderColor,
  },
  pillLayeredWashNegotiable: {
    backgroundColor: CardSystem.glass.negotiableTint,
    borderColor: CardSystem.glass.negotiableBorderColor,
  },
  pillTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.white,
  },
  pillNeutral: CardSystem.styles.pillNeutral,
  pillBlue: CardSystem.styles.pillBlue,
  pillAmber: CardSystem.styles.pillAmber,
  pillGreen: CardSystem.styles.pillGreen,
  pillRed: CardSystem.styles.pillRed,
  pillOrange: CardSystem.styles.pillOrange,
  detailText: {
    ...CardSystem.typography.pillText,
    color: Colors.text2,
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  remainingPill: {
    paddingHorizontal: 4.5,
    flexShrink: 0,
  },
  remainingText: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.text2,
    fontSize: 11,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    gap: 5,
    borderRadius: CardSystem.radius.inner,
  },
  footerNegotiablePill: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-start',
  },
  footerNegotiableSpacer: {
    flex: 1,
    minWidth: 0,
  },
  footerPricePillCompact: {
    flexShrink: 0,
    justifyContent: 'center',
  },
  negotiableText: {
    fontSize: 11,
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
    lineHeight: 15,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  budgetValText: {
    fontSize: 12.5,
    fontFamily: 'Almarai_800ExtraBold',
    color: Colors.accent,
    lineHeight: 15,
    writingDirection: 'rtl',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
})

export const listingCardBaseStyles = s

