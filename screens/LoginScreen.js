import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Client, Account } from 'react-native-appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1') 
  .setProject('6772848f000ad4e7d86b')

const account = new Account(client);

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const stopSession = async () => {
      try {
        await account.deleteSession('current');
      } catch (error) {
        if (error.message.includes('User (role: guests) missing scope (account)')) {
          console.log('No active session to stop.');
        } else {
          console.error('Failed to stop session', error);
        }
      }
    };

    stopSession();
  }, []);

  const navigateToHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      })
    );
  };

  const navigateToSignUp = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'SignUp' }],
      })
    );
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  async function login() {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      await account.createEmailPasswordSession(email, password);
      navigateToHome();
    } catch (error) {
      if (error.message.includes('Password must be between 8 and 256 characters long')) {
        Alert.alert('Invalid Password', 'Password must be between 8 and 256 characters long.');
      } else {
        Alert.alert('Login Failed', error.message);
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.Text}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder='Email'
        value={email}
        onChangeText={setEmail}
        onFocus={(e) => e.target.placeholder = ''}
        onBlur={(e) => e.target.placeholder = 'Email'}
      />
      <TextInput
        style={styles.input}
        placeholder='Password'
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onFocus={(e) => e.target.placeholder = ''}
        onBlur={(e) => e.target.placeholder = 'Password'}
      />
      <TouchableOpacity
        style={styles.Button}
        onPress={login}
      >
        <Text style={styles.ButtonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={navigateToSignUp}
      >
        <Text style={styles.PlainTextButton}>Don't have an account yet? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 150,
  },
  input: {
    alignContent: 'center',
    verticalAlign: "top",
    width: '85%',
    marginTop: 25,
    borderColor: 'black',
    borderWidth: 2,
    padding: 12,
    borderRadius: 10,
    fontSize: 20,
  },
  Text: {
    fontSize: 50,
    alignSelf: 'flex-start',
    textAlign: 'left',
    paddingStart: 30,
    fontWeight: 'bold',
    paddingBottom: 20,
  },
  Button: {
    marginTop: 30,
    width: '85%',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'navy',
    alignItems: 'center',
  },
  ButtonText: {
    fontSize: 20,
    color: 'white',
  },
  PlainTextButton: {
    marginTop: 20,
    fontSize: 16,
    color: 'blue',
  },
});
