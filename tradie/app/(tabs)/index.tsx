import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  SafeAreaView,
  Image,
  Animated,
  Easing,
  Alert,
  TextInput
} from 'react-native';
import { Card } from 'react-native-ui-lib';
import { useRouter, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getAllData, 
  getCeoData, 
  getCfoData, 
  getPresData, 
  getDirectorData, 
  getTenPercentData 
} from '@/api/tradieAPI';

const { width: screenWidth } = Dimensions.get('window');
const FAVORITES_STORAGE_KEY = 'tradie_favorites';

enum SortOrder {
  NONE = 'none',
  DESCENDING = 'descending',
  ASCENDING = 'ascending'
}

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
  id?: string; 
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
  const [favorites, setFavorites] = useState<TradeData[]>([]);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  // Animation value for pulsing logo
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Load favorites from AsyncStorage on component mount
  useEffect(() => {
    loadFavorites();
  }, []);
  
  // Reload favorites every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      return () => {
        // Cleanup function if needed
      };
    }, [])
  );
  
  // Extract loadFavorites to a separate function that can be reused
  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(parsedFavorites);
      } else {
        // If no favorites found, set to empty array
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      // Set empty array on error
      setFavorites([]);
    }
  };

  useEffect(() => {
    // Only run the animation when loading
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading, pulseAnim]);
  
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
      setSortOrder(SortOrder.DESCENDING);
    } else {
      setSortOrder(SortOrder.NONE);
    }
  };

  //trade id 
  const generateTradeId = (item: TradeData): string => {
    return `${item.ticker}-${item.insiderName}-${item.tradeDate}-${item.quantity}-${item.price}`;
  };

  // Check if a trade is already in favorites
  const isTradeInFavorites = (item: TradeData): boolean => {
    const tradeId = generateTradeId(item);
    return favorites.some(fav => generateTradeId(fav) === tradeId);
  };

  // Function to toggle favorite status of a stock card
  const toggleFavorite = async (item: TradeData) => {
    try {
      const tradeId = generateTradeId(item);
      let newFavorites: TradeData[];
      
      if (isTradeInFavorites(item)) {
        // Remove from favorites if already present
        newFavorites = favorites.filter(fav => generateTradeId(fav) !== tradeId);
      } else {
        // Add to favorites with a generated ID
        const itemWithId = {
          ...item,
          id: tradeId
        };
        newFavorites = [...favorites, itemWithId];
      }
      
      setFavorites(newFavorites);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY, 
        JSON.stringify(newFavorites)
      );
      
  
      
    } catch (error) {
      console.error('Error saving favorite:', error);
      Alert.alert('Error', 'Failed to save favorite');
    }
  };
 //tabs 
  const getFilteredData = () => {
    let data: TradeData[] = [];
    
    switch (activeTab) {
      case 'CEO':
        data = ceoData || [];
        break;
      case 'Pres':
        data = presData || [];
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

    //sorting
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

  // Animation for the bookmark button
  const animateBookmark = (ticker: string) => {
    const scaleAnim = new Animated.Value(1);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start(() => {
      // Pass the item from filteredData that matches the ticker
      const item = filteredData.find(item => item.ticker === ticker);
      if (item) {
        toggleFavorite(item);
      }
    });
    
    return scaleAnim;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [filteredResults, setFilteredResults] = useState<TradeData[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setIsSearchActive(false);
      return;
    }
    
    setIsSearchActive(true);
    const lowercaseQuery = query.toLowerCase();
    
    // Filter the data based on the search query
    const results = filteredData.filter(item => 
      item.ticker.toLowerCase().includes(lowercaseQuery) || 
      item.insiderName.toLowerCase().includes(lowercaseQuery)
    );
    
    setFilteredResults(results);
  };

  // Determine which data to display based on search
  const dataToDisplay = isSearchActive ? filteredResults : filteredData;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.Image 
          source={require('@/assets/images/TradieLogo-removebg-preview.png')}
          style={[
            styles.loadingLogo,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('@/assets/images/TradieLogo-removebg-preview.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerSubtitle}>Let's stalk insiders together.</Text>
        </View>
        
        {/* Sort Button in Header */}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={toggleSortOrder}
        >
          <Text style={styles.sortButtonText}>
            { 
             sortOrder === SortOrder.DESCENDING ? ' % Increase' : 
             'Sort'}
          </Text>
          <IconSymbol
            size={16}
            name={
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
              {/* Search Bar */}
              <View style={styles.searchBar}>
                <IconSymbol
                  size={18}
                  name="magnifyingglass"
                  color="#9EA0A4"
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search ticker or insider"
                  placeholderTextColor="#666666"
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
                {searchQuery.trim() !== '' && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      setSearchQuery('');
                      setIsSearchActive(false);
                    }}
                  >
                    <IconSymbol size={14} name="xmark" color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Category Tabs */}
              <View style={styles.tabsContainer}>
                {['All', 'CEO', 'Pres', 'CFO', 'Dir', '10%'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tab,
                      activeTab === tab && styles.activeTab
                    ]}
                    onPress={() => {
                      setActiveTab(tab);
                      // Clear search when changing tabs
                      if (isSearchActive) {
                        setSearchQuery('');
                        setIsSearchActive(false);
                      }
                    }}
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

              {/* Display data based on search state */}
              {dataToDisplay.length > 0 ? (
                dataToDisplay.map((item, index) => {
                  const isFavorite = isTradeInFavorites(item);
                  
                  return (
                    <View key={index} style={styles.cardContainer}>
                      {/* Bookmark Button */}
                      <TouchableOpacity 
                        style={styles.bookmarkButton}
                        onPress={() => {
                          toggleFavorite(item);
                        }}
                      >
                        <View>
                          <IconSymbol 
                            size={24} 
                            name={isFavorite ? "bookmark.fill" : "bookmark"} 
                            color={isFavorite ? "#4C6EF5" : "#FFFFFF"} 
                          />
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
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
                    </View>
                  );
                })
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                    {isSearchActive 
                      ? `No results found for "${searchQuery}"` 
                      : 'No insider trades found for this category'}
                  </Text>
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
  loadingLogo: {
    width: 100,
    height: 100,
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
  logo: {
    width: 150,
    height: 70,
    marginLeft: -45,
    marginBottom: 3,
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
  cardContainer: {
    position: 'relative',
    marginVertical: 8,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: '#333333',
    marginTop: -15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    color: '#FFFFFF',
    fontSize: 13,
  },
  clearButton: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#333333',
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});