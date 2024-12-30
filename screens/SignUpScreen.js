import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Client, Account, ID } from 'react-native-appwrite';

const client = new Client();
client
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6772848f000ad4e7d86b')   

const account = new Account(client);

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const navigateToHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      })
    );
  };

  const navigateToLogin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  async function register() {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      await account.create(ID.unique(), email, password, name);
      navigateToHome();
    } catch (error) {
      if (error.message.includes('A user with the same id, email, or phone already exists in this project.')) {
        Alert.alert('A user with the same email already exists. Please use a different email.');
      } else if (error.message.includes('Password must be between 8 and 265 characters long')) {
        Alert.alert('Invalid Password', 'Password must be between 8 and 265 characters long.');
      } else {
        console.error('Registration failed', error);
        Alert.alert('Registration failed. Please try again.');
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.Text}>SignUp</Text>
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
        placeholder='Username'
        value={name}
        onChangeText={setName}
        onFocus={(e) => e.target.placeholder = ''}
        onBlur={(e) => e.target.placeholder = 'Username'}
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
        onPress={register}
      >
        <Text style={styles.ButtonText}>SignUp</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={navigateToLogin}
      >
        <Text style={styles.PlainTextButton}>Already have an account? Login</Text>
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
    textAlign: "left",
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