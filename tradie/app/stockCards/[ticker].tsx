import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getAIAnalysis, getChartData } from '@/api/tradieAPI';
import { LineChart } from 'react-native-svg-charts';
import * as shape from 'd3-shape';

// Define the structure for the analysis response
interface AnalysisResponse {
  summary: string;
  prediction: string;
  error?: string;
}

// Define the chart data structure
interface ChartDataPoint {
  date: string;
  close: number;
}

export default function StockDetails() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isCustomChartLoading, setIsCustomChartLoading] = useState(true);
  
  // Animation value for pulsing logo
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
    tradeType = 'Purchase',
  } = useLocalSearchParams();

  const tradeTypeString = Array.isArray(tradeType) ? tradeType[0] : String(tradeType);

  const handleBackPress = () => {
    router.back();
  };

  // JSON DATA YEAR TO DATE 
  useEffect(() => {
    const fetchChartData = async () => {
      if (!ticker) return;
      
      setIsCustomChartLoading(true);
      try {
        const data = await getChartData(String(ticker));
        setChartData(data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsCustomChartLoading(false);
      }
    };
    
    fetchChartData();
  }, [ticker]);

  // Start the pulsing animation when the component mounts
  useEffect(() => {
    if (isChartLoading) {
      // Start animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [isChartLoading, pulseAnim]);

  // Function to fetch AI analysis using tradieAPI
  const fetchAnalysis = async () => {
    if (!ticker) return; 
    
    setIsAnalysisLoading(true);
    setAnalysisResult(null); // Clear previous result
    try {
      const result = await getAIAnalysis(String(ticker));
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setAnalysisResult({
        summary: result.summary || "No summary available",
        prediction: result.prediction || "No prediction available"
      });
    } catch (error) {
      console.error("Error fetching analysis:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not load AI analysis. Please try again later.";
      Alert.alert("Error", errorMessage);
      setAnalysisResult({ 
        summary: "Unable to generate analysis at this time.",
        prediction: "Please try again later.",
        error: errorMessage 
      });
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <IconSymbol size={24} name="chevron.left" color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ticker}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Company and Insider Info */}
        <View style={styles.companyContainer}>
          <View style={styles.companyHeader}>
            <View>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.tickerSymbol}>{ticker}</Text>
            </View>
          </View>
          
          <View style={styles.insiderInfo}>
            <TouchableOpacity
              onPress={() => handlePressInsiderName(String(insiderName))}
            >
              <Text style={styles.insiderName}>{insiderName}</Text>
            </TouchableOpacity>
            <View style={styles.insiderTagRow}>
              <View style={styles.insiderTag}>
                <Text style={styles.insiderTagText}>{title}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{price}</Text>
            <View style={[
              styles.tradeBadge, 
              tradeTypeString.toLowerCase() === 'purchase' ? styles.purchaseBadge : styles.saleBadge
            ]}>
              <Text style={styles.tradeBadgeText}>
                {tradeTypeString.toLowerCase() === 'purchase' ? 'Purchase' : 'Sale'}
              </Text>
            </View>
          </View>
          
          <View style={styles.valueChangeRow}>
            <Text style={styles.valueChange}>
              {Number(percentOwnedIncrease) > 0 ? '+' : ''}{percentOwnedIncrease}%
            </Text>
            <Text style={styles.valueChangeLabel}>Position Invested</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Stock Chart</Text>
          </View>
          
          <View style={styles.webViewContainer}>
            {isChartLoading && (
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
            )}
            <WebView
              source={{ uri: `https://finance.yahoo.com/chart/${ticker}` }}
              style={styles.webView}
              onLoadEnd={() => setIsChartLoading(false)}
            />
          </View>
        </View>
        
        {/* Custom SVG Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Custom Price Chart</Text>
          </View>
          
          <View style={styles.customChartContainer}>
            {isCustomChartLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4C6EF5" />
              </View>
            ) : chartData.length > 0 ? (
              <>
                <LineChart
                  style={{ height: 200, width: '100%' }}
                  data={chartData.map(item => item.close)}
                  curve={shape.curveNatural}
                  svg={{ 
                    stroke: chartData.length > 1 && 
                           chartData[chartData.length - 1].close > chartData[0].close 
                           ? '#4ade80' // Green for price increase
                           : '#ef4444', // Red for price decrease
                    strokeWidth: 2 
                  }}
                  contentInset={{ top: 20, bottom: 20, left: 0, right: 0 }}
                >
                </LineChart>
                <Text style={styles.chartCaption}>YTD</Text>
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No chart data available</Text>
              </View>
            )}
          </View>
        </View>
        

        {/* Trade Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Trade Details</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{tradeDate}</Text>
              <Text style={styles.detailLabel}>TRADE DATE</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{filingDate}</Text>
              <Text style={styles.detailLabel}>FILING DATE</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{quantity}</Text>
              <Text style={styles.detailLabel}>QUANTITY</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailValue}>{alreadyOwned}</Text>
              <Text style={styles.detailLabel}>NOW OWNED</Text>
            </View>
          </View>
        </View>
        
        {/* Value Metrics */}
        <View style={styles.metricsSection}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>TOTAL VALUE</Text>
            <Text style={styles.metricValue}>{moneyValueIncrease}</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>OWNED INCREASE</Text>
            <Text style={styles.metricValue}>{percentOwnedIncrease}%</Text>
          </View>
        </View>
        
        {/* AI Analysis Section */}
        <View style={styles.analysisSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={fetchAnalysis}
            disabled={isAnalysisLoading}
          >
            {isAnalysisLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>Get Stock Analysis</Text>
            )}
          </TouchableOpacity>
          
          {analysisResult && (
            <View style={styles.analysisContent}>
              <View style={styles.analysisBlock}>
                <Text style={styles.analysisTitle}>Summary</Text>
                <Text style={styles.analysisText}>{analysisResult.summary}</Text>
              </View>
              
              <View style={styles.analysisBlock}>
                <Text style={styles.analysisTitle}>Prediction</Text>
                <Text style={styles.analysisText}>{analysisResult.prediction}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal for insider search */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <IconSymbol size={24} name="xmark" color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Insider Details</Text>
            <View style={styles.headerRight}/>
          </View>

          <WebView
            source={{
              uri: `https://www.google.com/search?q=${encodeURIComponent(searchText)}`,
            }}
            style={styles.modalWebView}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#121212',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
  },
  companyContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tickerSymbol: {
    fontSize: 16,
    color: '#AEAEAE',
  },
  insiderInfo: {
    marginBottom: 16,
  },
  insiderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4C6EF5',
    marginBottom: 6,
  },
  insiderTagRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  insiderTag: {
    backgroundColor: '#4C6EF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  insiderTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 12,
  },
  tradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  purchaseBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  saleBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  tradeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  valueChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueChange: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ade80',
    marginRight: 8,
  },
  valueChangeLabel: {
    fontSize: 14,
    color: '#AEAEAE',
  },
  chartContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  chartHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  webViewContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    zIndex: 1,
  },
  loadingLogo: {
    width: 80,
    height: 80,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  detailsSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#AEAEAE',
  },
  metricsSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  metricLabel: {
    fontSize: 14,
    color: '#AEAEAE',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  analysisSection: {
    marginTop: 16,
  },
  analysisContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 16,
    color: '#AEAEAE',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4d4f', // Red color for errors
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#4C6EF5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalWebView: {
    flex: 1,
  },
  analysisBlock: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  customChartContainer: {
    height: 250,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  chartCaption: {
    fontSize: 12,
    color: '#AEAEAE',
    textAlign: 'center',
    marginTop: 8,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#AEAEAE',
  },
}); 