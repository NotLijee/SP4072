import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getCurrentUser, getUserProfile, signOutUser } from '@/backend/auth';

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

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);

  useEffect(() => {
    fetchUserData();
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2C3E50" />
      </View>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F5F5F7', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="person.crop.circle.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          
          <ThemedText style={styles.name}>
            {profile?.full_name || 'User'}
          </ThemedText>
          
          <ThemedText style={styles.email}>
            {user?.email}
          </ThemedText>
        </View>
        
        <View style={styles.infoSection}>
          <ThemedText style={styles.sectionTitle}>Account Information</ThemedText>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Email</ThemedText>
            <ThemedText style={styles.infoValue}>{user?.email}</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Name</ThemedText>
            <ThemedText style={styles.infoValue}>{profile?.full_name || 'Not set'}</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Member Since</ThemedText>
            <ThemedText style={styles.infoValue}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </ThemedText>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  container: {
    flex: 1,
    padding: 16,
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
    backgroundColor: '#2C3E50',
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
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
  },
  infoSection: {
    marginBottom: 30,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  infoLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#2C3E50',
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