import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';

export default function StockDetails() {
  const router = useRouter();

  // State for the modal and the search text
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Function to open the modal and set the search text
  const handlePressInsiderName = (name: string) => {
    setSearchText(name);
    setModalVisible(true);
  };

  const {
    ticker = 'AAPL',
    insiderName = 'Nancy Pelosi',
    tradeDate = '2023-01-01',
    filingDate = '2023-01-02',
    price = '145.32',
    quantity = '10,000',
    percentOwnedIncrease = '2.5',
    moneyValueIncrease = '1000000',
    companyName = 'Apple Inc.',
    title = 'CFO',
    alreadyOwned = '100,000',
  } = useLocalSearchParams();

  const handleBackPress = () => {
    router.push('/');
  };

  return (
    <LinearGradient
      // Feel free to adjust these colors to match your desired gradient
      colors={['#2F2F2F', '#1E1E1E']}
      style={styles.gradientContainer}
    >
      {/* Close / Back Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleBackPress}>
        <Ionicons name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            {/* Make the insider name clickable */}
              <Text style={styles.insiderName}>{insiderName}</Text>

            <Text style={styles.price}>{price}</Text>
            <Text style={styles.dailyChange}>
              Stock amount {moneyValueIncrease} (+{percentOwnedIncrease}%)
            </Text>
          </View>
          <Image
            // Replace with an actual URI or local image of your choice
            source={{ uri: 'https://via.placeholder.com/100' }}
            style={styles.insiderImage}
          />
        </View>

        {/* Chart (WebView) */}
        <View style={styles.webViewContainer}>
          <WebView
            source={{ uri: `https://finance.yahoo.com/chart/${ticker}` }}
            style={{ backgroundColor: 'transparent' }}
          />
        </View>

        {/* Overview Section */}
        <Text style={styles.overviewTitle}>Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ticker}</Text>
            <Text style={styles.statLabel}>TICKER</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tradeDate}</Text>
            <Text style={styles.statLabel}>TRADE DATE</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{filingDate}</Text>
            <Text style={styles.statLabel}>FILE DATE</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{title}</Text>
            <Text style={styles.statLabel}>TITLE</Text>
          </View>
        </View>

        {/* Additional Details (Optional) */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Company Details</Text>
          <Text style={styles.detail}>Company: {companyName}</Text>
          <TouchableOpacity onPress={() => handlePressInsiderName(insiderName as string)}>
          <Text style={styles.detail}>Insider: {insiderName}</Text>
          </TouchableOpacity>
          <Text style={styles.detail}>Previously Owned: {alreadyOwned} shares</Text>
          <Text style={styles.detail}>Quantity: {quantity} shares purchased</Text>
          <Text style={styles.detail}>% Owned Increase: {percentOwnedIncrease}%</Text>
        </View>

        {/* Creator / Copy Section */}
        <Text style={styles.creatorLabel}>AI Summary</Text>
        <TouchableOpacity style={styles.copyButton}>
          <Text style={styles.copyButtonText}>Summarize</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal to show the Google search for insider name */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          {/* Close button at the top */}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* WebView that loads the Google search */}
          <WebView
            source={{
              uri: `https://www.google.com/search?q=${encodeURIComponent(searchText)}`,
            }}
            style={{ flex: 1 }}
          />
        </SafeAreaView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 5,
    zIndex: 999,
    padding: 8,
  },
  scrollViewContent: {
    paddingVertical: 90,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerInfo: {
    flex: 1,
  },
  insiderName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#38a3a5',
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dailyChange: {
    fontSize: 16,
    color: '#57cc99',
  },
  insiderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  webViewContainer: {
    height: 300,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 8,
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#38a3a5',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 4,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  detail: {
    fontSize: 14,
    color: '#FFFFFF',
    marginVertical: 2,
  },
  creatorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  copyButton: {
    backgroundColor: '#80ed99',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  copyButtonText: {
    color: '#22577a',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 10,
    alignSelf: 'flex-end',
    backgroundColor: 'transparent',
  },
});
