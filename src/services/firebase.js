/* global __firebase_config */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfigString = typeof __firebase_config !== 'undefined' && __firebase_config
  ? __firebase_config
  : JSON.stringify({
      apiKey: "AIzaSyC5K4XwBY_JhFiEFIFQR-E9l-70NlSI_lA",
      authDomain: "desinfeccion-san-isidro.firebaseapp.com",
      projectId: "desinfeccion-san-isidro",
      storageBucket: "desinfeccion-san-isidro.appspot.com",
      messagingSenderId: "6257839819",
      appId: "1:6257839819:web:46c5b320b2161f8ea4554e"
    });

const firebaseConfig = JSON.parse(firebaseConfigString);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig }; // Export firebaseConfig too if needed elsewhere, or appId
