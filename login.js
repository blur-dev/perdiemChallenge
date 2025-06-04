import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { auth } from '../firebaseConfig';

export default function LoginScreen() {
  const provider = new GoogleAuthProvider();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  // email 
  const handleEmailLogin = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const nameToStore = user.displayName || user.email || 'User';
    
      // name for home screen
      await AsyncStorage.setItem('userName', nameToStore);

      console.log('✅ Firebase email login success:', user);
      router.replace('/home');
    } catch (err) {
      console.error('❌ Email Login Error:', err);
      Alert.alert('Login Failed', err.message);
    }
  };

  // google 
  const handleGoogleLogin = async () => {
    try {
      console.log("In handle Google Login");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;

      const nameToStore = user.displayName || user.email || 'User';
      await AsyncStorage.setItem('userName', nameToStore);

      console.log('✅ Firebase Google login success:', user);
      router.replace('/home');
    } catch (error) {
      console.error('❌ Google Login Error:', error);
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>Login</Text>

      <TextInput
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        style={{ marginBottom: 10, padding: 10, borderWidth: 1, borderRadius: 5 }}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        style={{ marginBottom: 20, padding: 10, borderWidth: 1, borderRadius: 5 }}
      />

      <Button title="Login with Email" onPress={handleEmailLogin} />

      <View style={{ height: 20 }} />

      <Button title="Login with Google" onPress={handleGoogleLogin} />
    </View>
  );
}
