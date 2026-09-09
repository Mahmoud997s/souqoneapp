import React from 'react'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { MyListingItem } from '../../../types/my-listings.types'

export interface MyListingActionButtonsProps {
  item: MyListingItem
  onDelete: (item: MyListingItem) => void
  onEdit: (item: MyListingItem) => void
  onStatusChange?: (item: MyListingItem) => void
  onCancelDeletionRequest?: (item: MyListingItem) => void
  isEditSupported: boolean
}

export function MyListingActionButtons({
  item,
  onDelete,
  onEdit,
  onStatusChange,
  onCancelDeletionRequest,
  isEditSupported,
}: MyListingActionButtonsProps) {
  // Check if there is a pending deletion request
  if (item.pendingDeletionRequest && item.pendingDeletionRequest.status === 'PENDING') {
    const createdAtMs = new Date(item.pendingDeletionRequest.createdAt).getTime()
    const isUnder24Hours = Date.now() - createdAtMs < 24 * 60 * 60 * 1000

    if (!isUnder24Hours) {
      // Locked for admin review, show disabled label
      return (
        <View style={s.actionRow}>
          <View style={[s.cancelRequestBtn, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
            <Text style={[s.cancelRequestTxt, { color: '#6B7280' }]}>قيد مراجعة الإدارة</Text>
          </View>
        </View>
      )
    }

    return (
      <View style={s.actionRow}>
        <TouchableOpacity
          style={s.cancelRequestBtn}
          activeOpacity={0.8}
          onPress={() => onCancelDeletionRequest && onCancelDeletionRequest(item)}
        >
          <Text style={s.cancelRequestTxt}>إلغاء طلب الحذف</Text>
        </TouchableOpacity>
      </View>
    )
  }

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
      {onStatusChange && item.entityType === 'car' && (
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
  cancelRequestBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cancelRequestTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#DC2626',
  },
})
