import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { Colors } from '../../src/constants/colors'

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: Colors.primary }}>
          المحادثة
        </Text>
        <Text style={{ fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: '#6B7280', marginTop: 8 }}>
          #{roomId}
        </Text>
      </View>
    </SafeAreaView>
  )
}
