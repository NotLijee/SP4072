import { Text, View, StyleSheet } from 'react-native'


export default function TradeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Trade Screen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 160,
    paddingVertical: 300,
    color: '#FFFFFF',
  },
})