import React from 'react';
import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button } from 'react-native';
import { signUp, signIn, signOut } from '@/backend/auth';
import  useAuth from '@/backend/useAuth'
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';


export default function TabTwoScreen() {


const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const user = useAuth();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>
      <View>
      {user ? (
        <>
          <Text>Welcome, {user.email}</Text>
          <Button title="Sign Out" onPress={signOut} />
        </>
      ) : (
        <>
          <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
          <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <Button title="Sign Up" onPress={() => signUp(email, password)} />
          <Button title="Sign In" onPress={() => signIn(email, password)} />
        </>
      )}
    </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  webViewContainer: {
    height: 400, // Adjust the height as needed
    width: '100%',
  },
});