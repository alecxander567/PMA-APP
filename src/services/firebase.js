import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDtrXuhkECIb4jjwwjzkUpPFghdpBbA-Ac",
  authDomain: "pma-01-54516.firebaseapp.com",
  projectId: "pma-01-54516",
  storageBucket: "pma-01-54516.firebasestorage.app",
  messagingSenderId: "653204533308",
  appId: "1:653204533308:web:1df5e1aebe1f9440519339",
  measurementId: "G-DEGLT2ZQSS"
};

let app;
let auth;
let db;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  db = getFirestore(app); 
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app); 
}

export { auth, app, db }; 