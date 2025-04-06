import React, { useState } from 'react';
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
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { signInUser, resetPassword } from '../../backend/auth';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
            
            <TouchableOpacity style={styles.googleButton}>
              <View style={styles.googleIconPlaceholder}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
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