import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDx78MxjboQawXZcR6nTW80_4AOxPjFoG8",
    authDomain: "perdiem-final.firebaseapp.com",
    projectId: "perdiem-final",
    storageBucket: "perdiem-final.firebasestorage.app",
    messagingSenderId: "840568921142",
    appId: "1:840568921142:web:7a49d0073ee40d361ecc97",
    measurementId: "G-BKW772GEKC"
  };
  

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 
