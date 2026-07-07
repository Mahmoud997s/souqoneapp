import { ReactNode } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '../../constants/colors'

interface SafeScreenProps {
  children: ReactNode
  style?: ViewStyle
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>
}

export function SafeScreen({ children, style, edges = ['top', 'left', 'right'] }: SafeScreenProps) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
})
