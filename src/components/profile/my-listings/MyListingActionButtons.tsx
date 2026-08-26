import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { MyListingItem } from '../../../types/my-listings.types'

export interface MyListingActionButtonsProps {
  item: MyListingItem
  onDelete: (item: MyListingItem) => void
  onEdit: (item: MyListingItem) => void
  onStatusChange?: (item: MyListingItem) => void
  isEditSupported: boolean
}

export function MyListingActionButtons({
  item,
  onDelete,
  onEdit,
  onStatusChange,
  isEditSupported,
}: MyListingActionButtonsProps) {
  return (
    <View style={s.actionRow}>
      {/* Delete Action Button */}
      <TouchableOpacity
        style={s.actionBtn}
        activeOpacity={0.8}
        onPress={() => onDelete(item)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="trash" size={16} color="#ef4444" />
      </TouchableOpacity>

      {/* Edit Action Button (shown only when entity supports editing) */}
      {isEditSupported && (
        <TouchableOpacity
          style={s.actionBtn}
          activeOpacity={0.8}
          onPress={() => onEdit(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="pencil" size={16} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* Overflow Menu / Status Change */}
      {onStatusChange && (
        <TouchableOpacity
          style={s.actionBtn}
          activeOpacity={0.8}
          onPress={() => onStatusChange(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
})
