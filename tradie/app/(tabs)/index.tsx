import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';

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
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        {allData && (
          <>
            <Text style={styles.title}>Today's Insider Stocks :</Text>
            {allData.map((item, index) => (
              <Text key={index} style={styles.jsonText}>{item.ticker}</Text>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 50,
  },
  jsonText: {
    fontSize: 14,
    fontFamily: 'monospace', // Use a monospace font for better readability
    marginVertical: 8,
  },
});

export default App;