import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import FFT from 'fft.js';
import * as FileSystem from 'expo-file-system';
import { CommonActions } from '@react-navigation/native';
import { Client, Account } from 'react-native-appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1') 
  .setProject('6772848f000ad4e7d86b')

const account = new Account(client);

export default function HomeScreen({ navigation }) {
  const [dominantFrequency, setDominantFrequency] = useState('--- Hz');
  const [chord, setChord] = useState('-'); 
  const chordRef = useRef(chord); 

  let recording = null;
  let intervalId = null;
  let isProcessing = false;

  useEffect(() => {
    chordRef.current = chord;
  }, [chord]);

  useEffect(() => {
    const configureAudioMode = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Microphone permission is required to use this feature.');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Error configuring audio mode:', error);
        return false;
      }
    };

    const startRecording = async () => {
      try {
        if (recording) {
          console.warn('A recording is already in progress.');
          return;
        }

        const recordAndProcess = async () => {
          if (isProcessing) {
            return;
          }
          isProcessing = true;

          try {
            if (recording) {
              await recording.stopAndUnloadAsync();
              recording = null;
            }

            recording = new Audio.Recording();

            await recording.prepareToRecordAsync({
              android: {
                extension: '.wav',
                outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
                audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
                sampleRate: 44100,
                numberOfChannels: 1,
              },
              ios: {
                extension: '.wav',
                outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
                audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
                sampleRate: 44100,
                numberOfChannels: 1,
              },
            });

            await recording.startAsync();

            setTimeout(async () => {
              if (recording) {
                const uri = recording.getURI();
                await recording.stopAndUnloadAsync();
                recording = null;
                if (uri) {
                  await processAudioFile(uri);
                  await FileSystem.deleteAsync(uri); 
                }
              }
            }, 100);
          } catch (error) {
            console.error('Error during recording or processing:', error);
          } finally {
            isProcessing = false;
          }
        };

        intervalId = setInterval(recordAndProcess, 300); 
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    };

    const processAudioFile = async (uri) => {
      try {
        const fileData = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const audioBuffer = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));

        if (!audioBuffer || audioBuffer.length <= 44) {
          console.warn('Audio buffer is empty or invalid.');
          return;
        }

        let offset = 12;
        while (offset < audioBuffer.length) {
          const chunkId = String.fromCharCode(
            audioBuffer[offset],
            audioBuffer[offset + 1],
            audioBuffer[offset + 2],
            audioBuffer[offset + 3]
          );
          const chunkSize = audioBuffer[offset + 4] |
                            (audioBuffer[offset + 5] << 8) |
                            (audioBuffer[offset + 6] << 16) |
                            (audioBuffer[offset + 7] << 24);

          if (chunkId === "data") {
            const pcmData = audioBuffer.slice(offset + 8, offset + 8 + chunkSize);
            return analyzePCMData(pcmData, chordRef.current); 
          }

          offset += 8 + chunkSize;
        }

        console.warn('No PCM data found.');
      } catch (error) {
        console.error('Error processing audio file:', error);
      }
    };

    const analyzePCMData = (pcmData, currentChord) => {
      const fft = new FFT(2048);
      const input = fft.createComplexArray();
      const output = fft.createComplexArray();
    
      for (let i = 0; i < Math.min(fft.size, pcmData.length / 2); i++) {
        const sample = (pcmData[i * 2 + 1] << 8) | pcmData[i * 2];
        const signedSample = sample > 32767 ? sample - 65536 : sample;
        input[i] = signedSample / 32768.0;
      }
    
      try {
        fft.transform(output, input);
      } catch (error) {
        console.error("FFT transformation failed:", error);
        return;
      }
    
      const frequencies = [];
      for (let i = 0; i < output.length / 2; i++) {
        const real = output[i * 2];
        const imag = output[i * 2 + 1];
        const magnitude = Math.sqrt(real ** 2 + imag ** 2);
        const frequency = (i / fft.size) * (44100 / 2);
    
        if (frequency <= 5000) {
          frequencies.push({ freq: frequency, magnitude });
        }
      }
    
      const validFrequencies = frequencies.filter((f) => f.magnitude > 0);
    
      if (validFrequencies.length === 0) {
        setDominantFrequency('--- Hz');
        return;
      }
    
      const dominant = validFrequencies.reduce((prev, curr) =>
        curr.magnitude > prev.magnitude ? curr : prev
      );
    
      const roundedFreq = Math.round(dominant.freq);
      console.log("Current frequency:", roundedFreq);
    
      const targetFrequencies = {
        E: 82,
        e: 330,
        A: 110,
        D: 147,
        G: 196,
        B: 247,
      };
    
      const targetFrequency = targetFrequencies[currentChord];
      if (!targetFrequency) {
        setDominantFrequency('--- Hz');
        return;
      }
    
      const frequencyDiff = targetFrequency - roundedFreq;
    
      if (Math.abs(frequencyDiff) < 50) {
        setDominantFrequency(
          `${frequencyDiff > 0 ? "+" : ""}${frequencyDiff} Hz`
        );
      } else {
        setDominantFrequency('--- Hz');
      }
    };
    
    

    const stopRecording = async () => {
      try {
        if (recording) {
          await recording.stopAndUnloadAsync();
          recording = null;
        }
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (error) {
        console.error('Failed to stop recording:', error);
      }
    };

    (async () => {
      const isConfigured = await configureAudioMode();
      if (isConfigured) {
        await startRecording();
      }
    })();

    return () => {
      stopRecording();
    };
  }, []);

  const logout = async () => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    }

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={logout} ><Text style={styles.buttonText}>LogOut</Text></TouchableOpacity>
      <View style={styles.TunerContainer}>
      <Text style={styles.Bar}>{dominantFrequency}</Text> 
      <Text style={styles.chord}>{chord}</Text> 

      </View>
      <View style={styles.buttonContainer}>
        <View style={styles.buttonColumn}>
          <TouchableOpacity style={styles.button} onPress={() => {setChord('D'); console.log("Button pressed:", 'D');}}><Text style={styles.buttonText}>D</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => {setChord('A'); console.log("Button pressed:", 'A');}}><Text style={styles.buttonText}>A</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => {setChord('E'); console.log("Button pressed:", 'E');}}><Text style={styles.buttonText}>E</Text></TouchableOpacity>
        </View>
        <Image source={require('../assets/GuitarGraphic.png')} style={styles.image} />
        <View style={styles.buttonColumn}>
          <TouchableOpacity style={styles.button} onPress={() => {setChord('G'); console.log("Button pressed:", 'G');}}><Text style={styles.buttonText}>G</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => {setChord('B'); console.log("Button pressed:", 'B');}}><Text style={styles.buttonText}>B</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => {setChord('e'); console.log("Button pressed:", 'E');}}><Text style={styles.buttonText}>E</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgb(255, 0, 111)',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 140,
  },
  button: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', 
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center', 
    marginTop: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white', 
    opacity: 1,
  },
  image: {
    width: 235 * 0.9,
    height: 387 * 0.9,
    marginVertical: 50,
    marginHorizontal: 15,
  },
  chord: {
    fontSize: 150,
    color: 'white',
    fontWeight: 'bold',
    paddingBottom: 10,
    alignContent: 'center',
    textAlign: 'center',
  },
  Bar: {
    fontSize: 50,
    color: 'white',
    fontWeight: 'bold',
    paddingBottom: 10,
    alignContent: 'center',
    textAlign: 'center',
  },
  logoutButton: {
    alignSelf: 'flex-end',
    padding: 10,
    paddingHorizontal: 20,
    marginBottom: 40,  
    marginHorizontal: 15,
    borderRadius: 10, 
    backgroundColor: 'rgba(255, 255, 255, 0.5)', 
  },
});
