export interface MenuItem {
  icon: string
  title: string
  subTitle?: string
  route?: string
  onPress?: () => void
  iconColor?: string
  badge?: string | number
}
