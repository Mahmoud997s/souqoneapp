import { GOVERNORATE_OPTIONS, OMAN_LOCATIONS } from '../constants/locations'

export function resolveListingLocation(item: any, rawData?: any): string {
  const data = rawData || (item as any)?.raw || item || {}
  const govRef = data.governorateRef || item?.governorateRef
  const wilRef = data.wilayaRef || item?.wilayaRef

  if (govRef || wilRef) {
    const govName = govRef?.nameAr || govRef?.name || govRef?.nameEn || ''
    const wilName = wilRef ? (wilRef.nameAr || wilRef.name || wilRef.nameEn || '') : ''
    if (govName && wilName && govName !== wilName) {
      return `${govName}، ${wilName}`
    }
    return wilName || govName || ''
  }

  const rawGov = data.governorateName || data.details?.governorateName || item?.governorate || data.governorate
  const rawWil = data.wilayaName || data.details?.wilayaName || data.city || item?.city || data.wilaya || item?.wilaya

  let govLabel = ''
  if (typeof rawGov === 'string' && !rawGov.startsWith('OM_') && !rawGov.startsWith('OM-') && isNaN(Number(rawGov))) {
    govLabel = rawGov
  } else if (rawGov) {
    const strGov = String(rawGov).toUpperCase()
    const foundOpt = GOVERNORATE_OPTIONS.find(
      (o) => o.value.toUpperCase() === strGov || o.value.replace('_', '-').toUpperCase() === strGov.replace('_', '-')
    )
    if (foundOpt) {
      govLabel = foundOpt.labelAr
    } else {
      const foundLoc = OMAN_LOCATIONS.find(
        (l) => l.id.toUpperCase() === strGov || l.legacyId?.toUpperCase() === strGov
      )
      if (foundLoc) govLabel = foundLoc.labelAr
    }
  }

  let wilLabel = ''
  if (typeof rawWil === 'string') {
    wilLabel = rawWil
  } else if (rawWil?.nameAr) {
    wilLabel = rawWil.nameAr
  }

  if (govLabel && wilLabel && govLabel !== wilLabel) {
    return `${govLabel}، ${wilLabel}`
  }
  return wilLabel || govLabel || data.location || item?.location || ''
}
