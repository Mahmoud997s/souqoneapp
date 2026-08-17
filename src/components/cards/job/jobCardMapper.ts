import { DriverJob } from '../../../types/jobs.types'
import { ParsedJobCardData, JobCardChipItem } from './jobCard.types'
import { formatDate, formatSalary, getInitials, getAvatarColor } from '../../../utils/format'
import { getPostGovLabel, getPostCityLabel } from '../../../constants/locations'
import { LICENSE_TYPE_LABELS, EMPLOYMENT_TYPE_LABELS } from '../../../constants/jobs'

export function parseJobCardData(job: DriverJob): ParsedJobCardData {
  const isHiring = job.jobType?.toUpperCase() === 'HIRING'

  // Resolve poster name
  const posterName = isHiring
    ? (job.employerProfile?.companyName ?? job.user?.displayName ?? job.user?.username ?? 'صاحب عمل')
    : (job.driverProfile?.user?.displayName ?? job.user?.displayName ?? job.user?.username ?? 'سائق في سوق ون')

  const userId = job.userId ?? job.user?.id ?? job.id ?? ''
  const avatarColor = getAvatarColor(userId)
  const initials = getInitials(posterName)
  const avatarUrl = job.user?.avatarUrl

  const isVerified = Boolean(job.user?.isVerified || (job as any).isVerified)
  const isAvailable = Boolean(job.status === 'ACTIVE' || (job as any).isAvailable !== false)

  // Location display
  const rawGov = (job as any).governorate || ''
  const rawCity = (job as any).city || ''
  const govLabel = rawGov ? getPostGovLabel(rawGov) : ''
  const cityLabel = rawGov && rawCity ? getPostCityLabel(rawGov, rawCity) : rawCity
  const locationDisplay =
    govLabel || cityLabel
      ? `${govLabel}${cityLabel ? `، ${cityLabel}` : ''}`
      : 'موقع غير محدد'

  const formattedDate = formatDate(job.createdAt)

  // Build unified chips
  const chips: JobCardChipItem[] = []

  // 1. Employment Type Chip
  if (job.employmentType) {
    const label = EMPLOYMENT_TYPE_LABELS[job.employmentType] || job.employmentType
    chips.push({
      key: 'emp',
      label,
      icon: 'clock-time-four-outline',
      iconType: 'mci',
      styleType: 'neutral',
    })
  }

  // 2. Experience Years Chip
  if (job.experienceYears != null && job.experienceYears > 0) {
    chips.push({
      key: 'exp',
      label: `خبرة ${job.experienceYears} سنوات`,
      icon: 'ribbon-outline',
      iconType: 'ion',
      styleType: 'amber',
    })
  }

  // 3. License Types Chips
  if (job.licenseTypes && job.licenseTypes.length > 0) {
    job.licenseTypes.forEach((lic, idx) => {
      const label = LICENSE_TYPE_LABELS[lic] || lic
      chips.push({
        key: `lic-${idx}`,
        label,
        icon: 'card-outline',
        iconType: 'ion',
        styleType: 'blue',
      })
    })
  }

  // Salary format
  const formattedSalary = job.salary
    ? formatSalary(job.salary, job.salaryPeriod, job.currency)
    : 'الراتب غير محدد'

  const raw = (job as any).raw || job
  const applicationsCount =
    job._count?.applications ??
    raw?._count?.applications ??
    (job as any).applicationsCount ??
    raw?.applicationsCount ??
    0

  const rating = job.driverProfile?.averageRating ?? (job as any).rating ?? raw?.driverProfile?.averageRating ?? null

  return {
    id: job.id,
    title: job.title || 'إعلان وظيفة',
    description: job.description,
    posterName,
    avatarUrl,
    avatarColor,
    initials,
    isVerified,
    isAvailable,
    isHiring,
    locationDisplay,
    formattedDate,
    chips,
    formattedSalary,
    applicationsCount,
    rating,
  }
}
