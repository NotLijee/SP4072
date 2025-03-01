import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

export default function StockDetails() {
  const { ticker, insiderName, tradeDate, filingDate, price, quantity, percentOwnedIncrease } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stock Details</Text>
      <Text style={styles.detail}>Ticker: {ticker}</Text>
      <Text style={styles.detail}>Insider: {insiderName}</Text>
      <Text style={styles.detail}>Trade Date: {tradeDate}</Text>
      <Text style={styles.detail}>Filing Date: {filingDate}</Text>
      <Text style={styles.detail}>Price: ${price}</Text>
      <Text style={styles.detail}>Quantity: {quantity}</Text>
      <Text style={styles.detail}>% Owned Increase: {percentOwnedIncrease}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detail: {
    fontSize: 18,
    marginVertical: 5,
  },
});
