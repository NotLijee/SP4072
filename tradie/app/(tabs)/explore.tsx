import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, FlatList, Pressable, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getCurrentUser, getUserProfile, signOutUser } from '@/backend/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for user and profile
interface UserType {
  id: string;
  email: string;
  created_at?: string;
}

interface ProfileType {
  id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

// Define type for the trade data
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

// Define the storage key constant to match the one in index.tsx
const FAVORITES_STORAGE_KEY = 'tradie_favorites';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [favorites, setFavorites] = useState<TradeData[]>([]);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  useEffect(() => {
    fetchUserData();
    loadFavorites();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Get current authenticated user
      const { user: authUser, error: authError } = await getCurrentUser();
      
      if (authError || !authUser) {
        // If no authenticated user, redirect to login
        router.replace('/(auth)/login');
        return;
      }
      
      setUser(authUser as UserType);
      
      // Get user profile data
      const { profile: userProfile, error: profileError } = await getUserProfile(authUser.id);
      
      if (!profileError && userProfile) {
        setProfile(userProfile as ProfileType);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const removeFavorite = async (trade: TradeData) => {
    try {
      // Use the ID if it exists, otherwise create a unique identifier
      const tradeId = trade.id || `${trade.ticker}-${trade.insiderName}-${trade.tradeDate}-${trade.quantity}-${trade.price}`;
      const newFavorites = favorites.filter(fav => {
        const favId = fav.id || `${fav.ticker}-${fav.insiderName}-${fav.tradeDate}-${fav.quantity}-${fav.price}`;
        return favId !== tradeId;
      });
      
      setFavorites(newFavorites);
      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY, 
        JSON.stringify(newFavorites)
      );
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const navigateToTicker = (trade: TradeData) => {
    router.push({
      pathname: `/stockCards/[ticker]`,
      params: {
        ticker: trade.ticker,
        title: trade.title,
        tradeType: trade.tradeType,
        insiderName: trade.insiderName,
        companyName: trade.companyName,
        tradeDate: trade.tradeDate,
        filingDate: trade.filingDate,
        price: trade.price.toString(),
        quantity: trade.quantity.toString(),
        percentOwnedIncrease: trade.percentOwnedIncrease.toString(),
        alreadyOwned: trade.alreadyOwned,
        moneyValueIncrease: trade.moneyValueIncrease,
      }
    });
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await signOutUser();
              if (error) {
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              } else {
                router.replace('/(auth)/login');
              }
            } catch (err) {
              Alert.alert('Error', 'An unexpected error occurred.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderFavoriteItem = ({ item }: { item: TradeData }) => (
    <View style={styles.favoriteItem}>
      <TouchableOpacity
        style={styles.favoriteContent}
        onPress={() => navigateToTicker(item)}
      >
        <Text style={styles.favoriteTicker}>{item.ticker}</Text>
        <Text style={styles.favoriteInsider}>{item.insiderName} - {item.title}</Text>
        <Text style={styles.favoriteDetails}>
          <Text style={styles.favoritePercent}>+{item.percentOwnedIncrease}%</Text> on {item.tradeDate}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFavorite(item)}
      >
        <IconSymbol name="xmark.circle.fill" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  // Function to handle refresh when pulling down
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C6EF5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4C6EF5"
            colors={["#4C6EF5"]}
            progressBackgroundColor="#1E1E1E"
          />
        }
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.name}>
              {profile?.full_name || 'User'}
            </Text>
            
            <Text style={styles.email}>
              {user?.email}
            </Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
          
          {/* Favorites Section */}
          <View style={styles.favoritesSection}>
            <View style={styles.favoritesHeader}>
              <Text style={styles.sectionTitle}>Favorite Trades</Text>
              <Text style={styles.favoritesCount}>{favorites.length}</Text>
            </View>
            
            {favorites.length > 0 ? (
              <FlatList
                data={favorites}
                renderItem={renderFavoriteItem}
                keyExtractor={(item) => item.id || `${item.ticker}-${item.insiderName}-${item.tradeDate}-${item.quantity}`}
                contentContainerStyle={styles.favoritesList}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyFavorites}>
                <Text style={styles.emptyText}>No favorite trades yet</Text>
                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.exploreButtonText}>Explore Trades</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4C6EF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#AEAEAE',
  },
  infoSection: {
    marginBottom: 24,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  infoLabel: {
    fontSize: 16,
    color: '#AEAEAE',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  favoritesSection: {
    marginBottom: 24,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  favoritesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  favoritesCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C6EF5',
    backgroundColor: 'rgba(76, 110, 245, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  favoritesList: {
    paddingBottom: 8,
  },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  favoriteContent: {
    flex: 1,
  },
  favoriteTicker: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  favoriteInsider: {
    fontSize: 14,
    color: '#AEAEAE',
    marginTop: 2,
  },
  favoriteDetails: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
  },
  favoritePercent: {
    color: '#4ade80',
    fontWeight: '600',
  },
  removeButton: {
    padding: 6,
  },
  emptyFavorites: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#AEAEAE',
    marginBottom: 16,
  },
  exploreButton: {
    backgroundColor: 'rgba(76, 110, 245, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#4C6EF5',
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#4C6EF5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});