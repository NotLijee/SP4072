import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Appearance } from 'react-native';
import axios from 'axios';
import { Card } from 'react-native-ui-lib'; // Import the Card component
import { useRouter } from 'expo-router'; // Import the useRouter hook
import { LinearGradient } from 'expo-linear-gradient'; // Import the LinearGradient component

const { width: screenWidth } = Dimensions.get('window');
const colorScheme = Appearance.getColorScheme();
const API_URL = 'http://127.0.0.1:8000'; // Replace with your FastAPI server URL

// Define the TypeScript interface for the data
interface TradeData {
  x: string;
  filingDate: string;
  tradeDate: string;
  ticker: string;
  companyName: string;
  insiderName: string;
  title: string;
  tradeType: string;
  price: number;
  quantity: number;
  alreadyOwned: number;
  percentOwnedIncrease: number;
  moneyValueIncrease: number;
}

const fetchAllData = async (): Promise<TradeData[]> => {
  const response = await axios.get(`${API_URL}/allData`);
  return response.data;
};

const fetchCeoData = async (): Promise<TradeData[]> => {
  const response = await axios.get(`${API_URL}/ceo`);
  return response.data;
};

const fetchPresData = async (): Promise<TradeData[]> => {
  const response = await axios.get(`${API_URL}/pres`);
  return response.data;
};

const fetchCfoData = async (): Promise<TradeData[]> => {
  const response = await axios.get(`${API_URL}/cfo`);
  return response.data;
};

const App = () => {
  const [allData, setAllData] = useState<TradeData[] | null>(null);
  const [ceoData, setCeoData] = useState<TradeData[] | null>(null);
  const [presData, setPresData] = useState<TradeData[] | null>(null);
  const [cfoData, setCfoData] = useState<TradeData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter()


  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const allData = await fetchAllData();
        const ceoData = await fetchCeoData();
        const presData = await fetchPresData();
        const cfoData = await fetchCfoData();

        setAllData(allData);
        setCeoData(ceoData);
        setPresData(presData);
        setCfoData(cfoData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  if (loading) {
    return (
      <View style={styles.gradientContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.gradientContainer}>
      <View style={styles.innerContainer}>
        {allData && (
          <>
            <Text style={styles.title}>Insider Trades </Text>
            {allData.map((item, index) => (
              <TouchableOpacity  key={index}
              onPress={() =>
                router.push({
                  pathname: `/(tabs)/stockCards/[ticker]`,
                  params: {
                    ticker: item.ticker,
                    title: item.title,
                    tradeType: item.tradeType,
                    insiderName: item.insiderName,
                    companyName: item.companyName,
                    tradeDate: item.tradeDate,
                    filingDate: item.filingDate,
                    price: item.price.toString(),
                    quantity: item.quantity.toString(),
                    percentOwnedIncrease: item.percentOwnedIncrease.toString(),
                    alreadyOwned: item.alreadyOwned,
                    moneyValueIncrease: item.moneyValueIncrease,
                  },
                })
              }>
                <Card style={styles.card}>
                  <Card.Section
                    content={[
                      {text: "insider", style: styles.cardText},
                      { text: item.insiderName, style: styles.cardInsider },
                      { text: `ticker: ${item.ticker}`,style: styles.cardText }
                    ]}
                    style={styles.cardContent}
                  />
                  <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                      <Text style={styles.percentText}>+{item.percentOwnedIncrease}%</Text>
                      <Text style={styles.footerLabel}>% increase</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Text style={styles.footerText}>{item.filingDate}</Text>
                        <Text style={styles.footerLabel}>filing date</Text>
                      </View>
                    <View style={styles.footerItem}>
                      <Text style={styles.footerText}>{item.tradeDate}</Text>
                      <Text style={styles.footerLabel}>trade date</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </>
        )}
         {ceoData && (
          <>
            <Text style={styles.title}> CEO DATA :</Text>
            {ceoData.map((item, index) => (
              <Text key={index} style={styles.jsonText}>{item.companyName}</Text>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 50,
    color: '#FFFFFF',
  },
  jsonText: {
    fontSize: 14,
    fontFamily: 'monospace', // Use a monospace font for better readability
    marginVertical: 8,
  },
  card: {
    marginVertical: 8,
    width: screenWidth * 0.92,
    alignSelf: 'center',
    backgroundColor: '#333333',
    },
  cardContent: {
    padding: 16,
  },
  cardText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#FFFFFF',
    },
    cardInsider: {
      color: '#38a3a5',
      fontWeight: 'bold',

    },
    cardTicker: {
      color: '#22577a',
    },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  footerItem: {
    alignItems: 'center',
    marginLeft: 16, // Add margin to the left
    marginBottom: 8, // Add margin to the bottom
  },
  percentText: {
    fontSize: 14,
    color: 'green',
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 16,
    color: '#FFFFFF',
    
  },
  footerLabel: {
    fontSize: 12,
    color: '#c7f9cc',
  },

});

export default App;