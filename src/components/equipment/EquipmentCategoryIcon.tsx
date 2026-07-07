import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { EquipmentType } from '../../types/equipment.types'
import { EQUIPMENT_TYPES } from '../../utils/equipment-mappers'

interface Props {
  type: EquipmentType
  size?: number
  selected?: boolean
  onPress?: (type: EquipmentType) => void
}

const getIconName = (iconType: string): keyof typeof Ionicons.glyphMap => {
  switch (iconType) {
    case 'excavator': return 'hardware-chip-outline' // Fallback
    case 'bulldozer': return 'car-sport-outline'
    case 'crane': return 'build-outline'
    case 'loader': return 'construct-outline'
    case 'tractor': return 'car-outline'
    case 'dump-truck': return 'bus-outline'
    case 'forklift': return 'file-tray-stacked-outline'
    default: return 'hardware-chip-outline'
  }
}

export function EquipmentCategoryIcon({ type, size = 24, selected = false, onPress }: Props) {
  const config = EQUIPMENT_TYPES[type]
  if (!config) return null

  const iconName = getIconName(config.icon)

  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.container, selected && styles.selectedContainer]} 
        onPress={() => onPress(type)}
      >
        <Ionicons name={iconName} size={size} color={selected ? Colors.white : Colors.primary} />
        <Text style={[styles.label, selected && styles.selectedLabel]}>{config.label}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.staticContainer}>
      <Ionicons name={iconName} size={size} color={Colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minWidth: 80,
  },
  selectedContainer: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  staticContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(11, 36, 71, 0.05)',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.text,
    fontFamily: 'Almarai_700Bold',
  },
  selectedLabel: {
    color: Colors.white,
    fontFamily: 'Almarai_800ExtraBold',
  },
})
