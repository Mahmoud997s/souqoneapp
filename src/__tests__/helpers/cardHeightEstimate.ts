/**
 * Test-only helpers for calculating static card height estimates from styles.
 * (Static estimate from styles, NOT device-measured).
 *
 * NOTE: If a new row, margin, or padding is added to ListingCardBase or SkeletonCard JSX,
 * it must be added to these calculation helpers as well.
 */
import { CardSystem } from '../../constants/cardSystem'
import { listingCardBaseStyles } from '../../components/ui/ListingCardBase'
import { skeletonCardStyles } from '../../components/ui/SkeletonCard'

export function computeStaticCardBodyHeight(
  styles: typeof listingCardBaseStyles = listingCardBaseStyles,
  isCompact: boolean = false
): number {
  const detailsPadding = isCompact ? styles.cardDetailsCompact : styles.cardDetails
  const locationRow = isCompact ? styles.locationRowCompact : styles.locationRow
  const divider = isCompact ? styles.dividerCompact : styles.divider
  const footerDivider = isCompact ? styles.footerDividerCompact : styles.footerDivider

  const detailsPadTop = Number(detailsPadding.paddingTop ?? 0)
  const detailsPadBottom = Number(detailsPadding.paddingBottom ?? 0)

  // Title row (single-line title): CardSystem.typography.title.lineHeight (20)
  const titleHeight = Number(CardSystem.typography.title.lineHeight)

  // Location row: marginTop + marginBottom + CardSystem.typography.subtitle.lineHeight (15)
  const locMarginTop = Number(locationRow.marginTop ?? styles.locationRow.marginTop ?? 0)
  const locMarginBottom = Number(locationRow.marginBottom ?? styles.locationRow.marginBottom ?? 0)
  const locHeight = Number(CardSystem.typography.subtitle.lineHeight)
  const locationTotal = locMarginTop + locMarginBottom + locHeight

  // Divider 1: height (1) + marginBottom
  const divHeight = Number(styles.divider.height ?? 1)
  const divMarginBottom = Number(divider.marginBottom ?? styles.divider.marginBottom ?? 0)
  const dividerTotal = divHeight + divMarginBottom

  // Chips row (single row): pill paddingVertical*2 (5) + border*2 (2) + pillText.lineHeight (16) + detailsList.marginBottom (4)
  const pillPadV = Number(styles.detailPill.paddingVertical ?? 0) * 2
  const pillBorder = 2
  const pillTextHeight = Number(CardSystem.typography.pillText.lineHeight)
  const detailsMarginBottom = Number(styles.detailsList.marginBottom ?? 0)
  const detailsListTotal = pillPadV + pillBorder + pillTextHeight + detailsMarginBottom

  // Footer divider: height (1) + marginTop + marginBottom
  const fDivHeight = Number(styles.footerDivider.height ?? 1)
  const fDivMarginTop = Number(footerDivider.marginTop ?? styles.footerDivider.marginTop ?? 0)
  const fDivMarginBottom = Number(footerDivider.marginBottom ?? styles.footerDivider.marginBottom ?? 0)
  const footerDividerTotal = fDivHeight + fDivMarginTop + fDivMarginBottom

  // Footer row: budgetValText.lineHeight (15) + pill paddingVertical*2 (5) + border*2 (2)
  const budgetLineHeight = Number(styles.budgetValText.lineHeight)
  const footerPillPadV = Number(styles.detailPill.paddingVertical ?? 0) * 2
  const footerPillBorder = 2
  const footerRowTotal = budgetLineHeight + footerPillPadV + footerPillBorder

  return (
    detailsPadTop +
    detailsPadBottom +
    titleHeight +
    locationTotal +
    dividerTotal +
    detailsListTotal +
    footerDividerTotal +
    footerRowTotal
  )
}

export function computeStaticSkeletonBodyHeight(
  styles: typeof skeletonCardStyles = skeletonCardStyles,
  isCompact: boolean = false
): number {
  const bodyPadding = isCompact ? styles.bodyCompact : styles.body
  const padTop = Number(bodyPadding.paddingTop ?? 0)
  const padBottom = Number(bodyPadding.paddingBottom ?? 0)

  // Title / Badge row: max of titleLine.height (14) and badge.height (18) = 18
  const rowHeight = Math.max(Number(styles.titleLine.height ?? 0), Number(styles.badge.height ?? 0))

  // Location row: marginTop (2 or 3) + marginBottom (4 or 5) + locLine.height (11)
  const locRow = isCompact ? styles.locationRowCompact : styles.locationRow
  const locMarginTop = Number(locRow.marginTop ?? styles.locationRow.marginTop ?? 0)
  const locMarginBottom = Number(locRow.marginBottom ?? styles.locationRow.marginBottom ?? 0)
  const locHeight = Number(styles.locLine.height ?? 11)
  const locationTotal = locMarginTop + locMarginBottom + locHeight

  // Divider 1: height (1) + marginTop (1) + marginBottom (5)
  const div1 = isCompact ? styles.dividerCompact : styles.divider
  const divHeight = Number(styles.divider.height ?? 1)
  const divMarginTop = Number(div1.marginTop ?? styles.divider.marginTop ?? 0)
  const divMarginBottom = Number(div1.marginBottom ?? styles.divider.marginBottom ?? 0)
  const divider1Total = divHeight + divMarginTop + divMarginBottom

  // Chips row: chip.height (20) + chipsRow.marginBottom (5)
  const chipHeight = Number(styles.chip.height ?? 20)
  const chipsMarginBottom = Number(styles.chipsRow.marginBottom ?? 5)
  const chipsTotal = chipHeight + chipsMarginBottom

  // Divider 2: height (1) + marginTop (1) + marginBottom (5)
  const divider2Total = divHeight + divMarginTop + divMarginBottom

  // Footer: priceLine.height (18)
  const footerHeight = Math.max(Number(styles.timeLine.height ?? 0), Number(styles.priceLine.height ?? 0))

  return (
    padTop +
    padBottom +
    rowHeight +
    locationTotal +
    divider1Total +
    chipsTotal +
    divider2Total +
    footerHeight
  )
}
