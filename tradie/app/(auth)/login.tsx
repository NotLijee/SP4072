import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  Pressable,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { signInUser, resetPassword, signInWithGoogle } from '../../backend/auth';
import { supabase } from '../../backend/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Make sure we're ready for the redirect
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Add auth state change listener
  useEffect(() => {
    // Check if the user is already signed in
    const checkSession = async () => {
      console.log('Checking for existing session on login screen mount...');
      const { data } = await supabase.auth.getSession();
      
      if (data?.session) {
        console.log('Existing session found, redirecting to tabs...');
        router.replace('/(tabs)');
      } else {
        console.log('No existing session found, staying on login screen');
      }
    };
    
    checkSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, redirecting to tabs...');
        router.replace('/(tabs)');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    // Reset error
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await signInUser(email, password);
      
      if (error) {
        setError(typeof error === 'object' && error !== null && 'message' in error 
          ? error.message as string 
          : 'Invalid email or password');
        setIsLoading(false);
        return;
      }
      
      // Successfully logged in
      router.replace('/(tabs)');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    
    try {
      console.log('Starting Google sign-in flow...');
      const result = await signInWithGoogle();
      
      if (result.error) {
        console.error('Error initiating Google sign-in:', result.error);
        setError(typeof result.error === 'object' && result.error !== null && 'message' in result.error 
          ? result.error.message as string 
          : 'Failed to sign in with Google');
        setIsGoogleLoading(false);
        return;
      }
      
      // Successfully initiated Google sign-in
      if (result.data?.url) {
        console.log('Opening auth URL in browser:', result.data.url);
        
        try {
          // Use the device's actual IP here, matching what you used in the auth.js file
          const redirectUrl = 'exp://192.168.1.91:8081';
          console.log('Using redirect URL:', redirectUrl);
          
          // Open the URL in the browser
          const response = await WebBrowser.openAuthSessionAsync(
            result.data.url,
            redirectUrl
          );
          
          console.log('Browser auth session response:', response);
          
          if (response.type === 'success') {
            console.log('Browser returned success, URL:', response.url);
            
            // Session check loop - check multiple times with delay
            let tryCount = 0;
            const maxTries = 5;
            const checkSession = async () => {
              if (tryCount >= maxTries) {
                console.log(`Reached max session check attempts (${maxTries})`);
                setError('Could not establish session after authentication. Please try again.');
                setIsGoogleLoading(false);
                return;
              }
              
              console.log(`Checking for session (attempt ${tryCount + 1}/${maxTries})...`);
              const { data: sessionData } = await supabase.auth.getSession();
              console.log('Session check result:', sessionData);
              
              if (sessionData?.session) {
                console.log('Valid session found, redirecting to tabs...');
                // Navigate to main app screen
                router.replace('/(tabs)');
                setIsGoogleLoading(false);
              } else {
                console.log('No valid session found, waiting and trying again...');
                tryCount++;
                setTimeout(checkSession, 1000); // Wait 1 second before checking again
              }
            };
            
            // Start the session check loop
            checkSession();
          } else {
            console.log('Auth canceled or failed:', response.type);
            setError('Authentication was canceled or failed. Please try again.');
            setIsGoogleLoading(false);
          }
        } catch (browserError) {
          console.error('Browser error:', browserError);
          setError('Failed to open authentication window');
          setIsGoogleLoading(false);
        }
      } else {
        console.log('No URL returned from signInWithGoogle');
        setError('Could not initialize Google sign-in');
        setIsGoogleLoading(false);
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('An unexpected error occurred with Google sign-in');
      setIsGoogleLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push("/(auth)/signup");
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Password Reset",
      "Please enter your email address to receive a password reset link.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Send Reset Link", 
          onPress: async () => {
            if (email) {
              setIsLoading(true);
              try {
                const { error } = await resetPassword(email);
                setIsLoading(false);
                
                if (error) {
                  Alert.alert("Error", typeof error === 'object' && error !== null && 'message' in error 
                    ? error.message as string 
                    : "Failed to send reset link. Please try again.");
                } else {
                  Alert.alert("Reset Link Sent", "A password reset link has been sent to your email.");
                }
              } catch (err) {
                setIsLoading(false);
                Alert.alert("Error", "An unexpected error occurred. Please try again.");
              }
            } else {
              Alert.alert("Email Required", "Please enter your email address first.");
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
          <Image 
            source={require('@/assets/images/TradieLogo-removebg-preview.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
            <Text style={styles.headerTitle}>Tradie</Text>
            <Text style={styles.headerSubtitle}>Login and stalk insider trades</Text>
          </View>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.formContainer}>
            <View style={styles.inputOuterContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="yo@momma.com"
                  placeholderTextColor="#9EA0A4"
                />
              </View>
            </View>
            
            <View style={styles.inputOuterContainer}>
              <View style={styles.passwordHeader}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••••••"
                  placeholderTextColor="#9EA0A4"
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <IconSymbol 
                    size={22} 
                    name={showPassword ? "eye.slash" : "eye"} 
                    color="#9EA0A4" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setKeepSignedIn(!keepSignedIn)}
            >
              <View style={[styles.checkbox, keepSignedIn && styles.checkboxChecked]}>
                {keepSignedIn && (
                  <IconSymbol size={16} name="checkmark" color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Keep me signed in</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.orContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>or sign in with</Text>
              <View style={styles.divider} />
            </View>
            
            <TouchableOpacity 
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#000" style={{marginRight: 8}} />
              ) : (
                <View style={styles.googleIconPlaceholder}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
              )}
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpText}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  headerContainer: {
    marginTop: 40,
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  logo: {
    width: 170,
    height: 90,
    marginLeft: -45,
    marginBottom: -5,
    marginTop: -45
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#AEAEAE',
    marginBottom: -65,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputOuterContainer: {
    marginBottom: 24,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeIcon: {
    padding: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#666666',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4C6EF5',
    borderColor: '#4C6EF5',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  loginButton: {
    backgroundColor: '#4C6EF5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
  },
  orText: {
    paddingHorizontal: 16,
    color: '#9EA0A4',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  forgotPasswordText: {
    color: '#4C6EF5',
    fontSize: 14,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: '#9EA0A4',
    fontSize: 14,
    marginRight: 4,
  },
  signUpText: {
    color: '#4C6EF5',
    fontSize: 14,
    fontWeight: '600',
  }
}); 