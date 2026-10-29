import React from 'react'
import { DriverJob } from '../../../types/jobs.types'

export interface JobCardChipItem {
  key: string
  label: string
  icon: any
  iconType: 'ion' | 'mci'
  styleType: 'neutral' | 'blue' | 'amber' | 'green'
}

export interface ParsedJobCardData {
  id: string
  title: string
  description?: string
  posterName: string
  avatarUrl?: string
  avatarColor: string
  initials: string
  isVerified: boolean
  isAvailable: boolean
  isHiring: boolean
  locationDisplay: string
  formattedDate: string
  chips: JobCardChipItem[]
  formattedSalary: string
  applicationsCount: number
  rating?: number | null
}

export interface JobCardProps {
  job: DriverJob
  onPress?: () => void
  fullWidth?: boolean
  maxChips?: number
  actionMenu?: React.ReactNode
  compact?: boolean
}
