# Per Diem App – React Native (Expo)

## Setup and Run Instructions

### 1. Clone the Repository

```bash
https://github.com/your-username/perdiem-app.git
cd perdiem-app
```

### 2. **Install Dependencies**

```bash
npm install
```

### 3. **Install Expo CLI (if you don’t have it)**

```bash
npm install -g expo-cli
```

### 4. **Start the Development Server**

```bash
npx expo start
```

### 5. **Firebase Setup**

Ensure you have a valid `firebaseConfig.js` in the root directory with your Firebase credentials:

```js
// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

> Use environment variables in production.

---

## Features

- Google + email/password login
- Store open/closed logic based on base hours and override data
- Time slot selection with persistent storage
- Local and NYC timezone toggling
- Notifications 1 hour before selected slot
- Greeting based on current time
- Logged-in user name displayed + logout functionality

---

## Assumptions & Limitations

- Assumes the mock API endpoint is always available and public
- Google login uses `signInWithPopup`, which only works on web (you may replace with `expo-auth-session` for native)
- Notification permission must be granted by the user manually
- No backend for persisting bookings (only stored locally in AsyncStorage)
- Only 30 days ahead are shown for time slot generation

---

## Notes on Approach

- Chose **Day.js** with `timezone` and `utc` plugins for reliable timezone handling
- Time slot generation is dynamic: reads store hours + overrides, then builds 15-min intervals
- Used **AsyncStorage** to persist selected slot, timezone choice, and user name
- Notifications are scheduled with Expo’s API and cleared before each new one
- Home screen is cleanly structured using Flexbox, absolute layout for logout

---

## Loom Walkthrough Video

[▶️ Click to watch the app demo](https://www.loom.com/share/9f1fe97af8884b73ba12adfea67bddb2?sid=70f56e89-85ab-42e0-bc33-41922c5cf6bb)

> Replace this with your own Loom recording URL.

---

## File Structure

```
/your-project-root
│
├── firebaseConfig.js        # Firebase setup
├── app/
│   ├── home.js              # Home Screen logic
│   ├── login.js             # Login screen and auth flow
│
├── assets/                  # (Optional) images, icons, fonts
├── README.md
└── package.json
```

---
