import { User } from './auth.types'

export interface PublicProfileCounts {
  listings: number
  busListings: number
  equipmentListings: number
  operatorListings: number
  spareParts: number
  carServices: number
  jobs: number
}

export interface PublicProfile extends User {
  _count: PublicProfileCounts
  totalListings: number
}

export interface MenuItem {
  icon: string
  title: string
  subTitle?: string
  route?: string
  onPress?: () => void
  iconColor?: string
  badge?: string | number
}
