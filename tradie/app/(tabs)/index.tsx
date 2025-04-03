import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Card } from 'react-native-ui-lib';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { 
  getAllData, 
  getCeoData, 
  getCfoData, 
  getPresData, 
  getDirectorData, 
  getTenPercentData 
} from '@/api/tradieAPI';

const { width: screenWidth } = Dimensions.get('window');

// Define sort options as an enum
enum SortOrder {
  NONE = 'none',
  ASCENDING = 'ascending',
  DESCENDING = 'descending'
}

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

export default function HomeScreen() {
  const [allData, setAllData] = useState<TradeData[] | null>(null);
  const [ceoData, setCeoData] = useState<TradeData[] | null>(null);
  const [presData, setPresData] = useState<TradeData[] | null>(null);
  const [cfoData, setCfoData] = useState<TradeData[] | null>(null);
  const [dirData, setDirData] = useState<TradeData[] | null>(null);
  const [tenPercentData, setTenPercentData] = useState<TradeData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.NONE);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allDataResponse = await getAllData();
        const ceoDataResponse = await getCeoData();
        const presDataResponse = await getPresData();
        const cfoDataResponse = await getCfoData();
        const dirDataResponse = await getDirectorData();
        const tenPercentDataResponse = await getTenPercentData();

        setAllData(allDataResponse);
        setCeoData(ceoDataResponse);
        setPresData(presDataResponse);
        setCfoData(cfoDataResponse);
        setDirData(dirDataResponse);
        setTenPercentData(tenPercentDataResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle sort order when sort button is pressed
  const toggleSortOrder = () => {
    if (sortOrder === SortOrder.NONE) {
      setSortOrder(SortOrder.ASCENDING);
    } else if (sortOrder === SortOrder.ASCENDING) {
      setSortOrder(SortOrder.DESCENDING);
    } else {
      setSortOrder(SortOrder.NONE);
    }
  };

  // Function to get the data based on the active tab
  const getFilteredData = () => {
    let data: TradeData[] = [];
    
    switch (activeTab) {
      case 'CEO':
        data = ceoData || [];
        break;
      case 'CFO':
        data = cfoData || [];
        break;
      case 'Dir':
        data = dirData || [];
        break;
      case '10%':
        data = tenPercentData || [];
        break;
      case 'All':
      default:
        data = allData || [];
        break;
    }

    // Apply sorting if needed
    if (sortOrder !== SortOrder.NONE) {
      return [...data].sort((a, b) => {
        if (sortOrder === SortOrder.ASCENDING) {
          return a.percentOwnedIncrease - b.percentOwnedIncrease;
        } else {
          return b.percentOwnedIncrease - a.percentOwnedIncrease;
        }
      });
    }

    return data;
  };

  const filteredData = getFilteredData();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C6EF5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Tradie</Text>
          <Text style={styles.headerSubtitle}>Let's stalk insiders together.</Text>
        </View>
        
        {/* Sort Button in Header */}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={toggleSortOrder}
        >
          <Text style={styles.sortButtonText}>
            {sortOrder === SortOrder.ASCENDING ? '↑ % Increase' : 
             sortOrder === SortOrder.DESCENDING ? '↓ % Increase' : 
             'Sort'}
          </Text>
          <IconSymbol
            size={16}
            name={
              sortOrder === SortOrder.ASCENDING ? "arrow.up" :
              sortOrder === SortOrder.DESCENDING ? "arrow.down" :
              "arrow.up.arrow.down"
            }
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {allData && (
            <>
              {/* Category Tabs */}
              <View style={styles.tabsContainer}>
                {['All', 'CEO', 'CFO', 'Dir', '10%'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tab,
                      activeTab === tab && styles.activeTab
                    ]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text 
                      style={[
                        styles.tabText,
                        activeTab === tab && styles.activeTabText
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <TouchableOpacity 
                    key={index}
                    onPress={() =>
                      router.push({
                        pathname: `/stockCards/[ticker]`,
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
                    }
                  >
                    <Card style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.insiderLabel}>Insider</Text>
                        <Text style={styles.insiderName}>{item.insiderName}</Text>
                        <Text style={styles.ticker}>Ticker: {item.ticker}</Text>
                      </View>
                      
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
                ))
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No insider trades found for this category</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#AEAEAE',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 60,
  },
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tab: {
    marginRight: 8,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
  },
  activeTab: {
    backgroundColor: '#4C6EF5',
    borderColor: '#4C6EF5',
  },
  tabText: {
    color: '#AEAEAE',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sortButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  noDataContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  noDataText: {
    color: '#AEAEAE',
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    marginVertical: 8,
    width: screenWidth * 0.92,
    alignSelf: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
  },
  insiderLabel: {
    fontSize: 12,
    color: '#AEAEAE',
    marginBottom: 4,
  },
  insiderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4C6EF5',
    marginBottom: 8,
  },
  ticker: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#191919',
  },
  footerItem: {
    alignItems: 'center',
  },
  percentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ade80',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  footerLabel: {
    fontSize: 12,
    color: '#9EA0A4',
  },
});