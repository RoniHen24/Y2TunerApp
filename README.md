My project is a React Native App that includes user authentication and a guitar tuner. The app uses AppWrite to manage the users and their authentication, allowing users to sign up and log in. The feature of the app is a guitar tuner powered by Expo Audio API and FFT.js, enabling real-time audio processing. Users can select specific strings to tune(E, A, D, G, B, e), with the app displaying how much tuning up or down is required to achieve a tuned string. Navigation between Login, Sign and Home screens is implemented using React Navigation.

**How to use the app:**
  - Create a user or Login
  - Choose the string you want to tune by clicking on its button
  - Start tuning your guitar according to the displayed value, for example, +5 means you need to tune the string a bit higher (5hz higher).
  - Choose another string to tune by pressing its button or pressing the Logout button when finished tuning the guitar.


**Audio Processing steps in the code:**

**Configuring Audio Recording -**
In order to manage the audio setting I used the Expo Audio API. When Homescreen Loads, the app requests microphone permissions and configures the audio mode to allow recording on iOS. If permissions are denied, an alert is shown to the user. If granted, the app prepares to start recording audio snippets for analysis.

The recording configuration specifies platform-specific options:
Android: Uses .wav file format, with PCM 16-bit encoding, a sample rate of 44.1 kHz, and a single audio channel.
iOS: Uses Linear PCM encoding with high audio quality, matching the 44.1 kHz sample rate and single-channel settings.


**Recording Audio Snippets -**
The app uses Expo's Audio.Recording API to capture short audio snippets repeatedly:

A recording session begins, and a new recording instance is prepared with the specified audio settings.
The app records for 100 milliseconds at a time and then stops the recording.
The recorded audio file is saved temporarily, with its URI passed for further processing.
To ensure continuous analysis, the app sets up an interval to repeat this recording and processing cycle every 300 milliseconds. The interval ensures periodic updates without blocking the UI.


**Processing the Recorded Audio -**
The recorded audio file is read using Expo FileSystem, with the content encoded in Base64. The app decodes this data into a binary Uint8Array, which represents the raw audio data. The app parses the audio file format to locate the data chunk containing PCM (Pulse Code Modulation) samples.
PCM data is the raw amplitude values of the audio waveform, which the app extracts for frequency analysis.


**Analyzing the Audio Using FFT -**
The main analysis involves extracting frequency information from the PCM data using the Fast Fourier Transform (FFT):

The FFT algorithm is initialized with a size of 2048 samples. It converts the time-domain audio data into the frequency domain, where each frequency component's amplitude is identified.
PCM samples are normalized to a range between -1.0 and 1.0 and fed into the FFT input.
The FFT output provides complex numbers for each frequency bin, which are used to calculate the magnitude of each frequency component.
The app identifies the dominant frequency by selecting the frequency bin with the highest magnitude. Frequencies above 5 kHz are ignored, as guitar strings operate within a lower range.


**Comparing Detected Frequencies with Target -**
Once the dominant frequency is calculated, the app compares it to predefined target frequencies for each guitar string:

E (82 Hz), A (110 Hz), D (147 Hz), G (196 Hz), B (247 Hz), and e (330 Hz).
If the user has selected a target chord, the app calculates the difference between the detected frequency and the target. If the difference is within a threshold (±50 Hz), the app displays this difference with a "+" or "-" sign to guide tuning adjustments. Otherwise, it shows "--- Hz" to indicate that the frequency is far off.



Some strings, like the lower E and occasionally the A string, may not work effectively with these methods due to the limitations of FFT and PCM processing at lower frequencies. Lower frequencies have fewer data points in the FFT spectrum, making it harder to achieve precise resolution and distinguish the frequency from overtones or noise


**AppWrite:**

In The App, authentication and user creation are implemented using Appwrite's `Account` object. The `LoginScreen` uses the `account.createEmailPasswordSession` method to log users in by verifying their email and password, creating a session if valid. The `SignUpScreen` uses the `account.create` method to register new users by providing a unique ID, email, password, and name. Both screens use the configured Appwrite `Client`, connecting to the Appwrite server via the provided endpoint and project ID.

**Running the Project**
Unfortunately, I could only test the app on ios so I don't know if the app works on Android. 
I ran the app by just typing `npm start` in the terminal, and then I scanned the QR code via the camera app. 


**App.js** is used only as a navigation tool.

The project took me a week to create, I worked on it almost every day of the week.  













