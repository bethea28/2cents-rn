import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Verified Firebase Credentials
const firebaseConfig = {
    apiKey: "AIzaSyCjCq8XBF0KY3eFOk5mt_K1LGNuHGt_JWQ",
    authDomain: "cents-fe1c4.firebaseapp.com",
    projectId: "cents-fe1c4",
    storageBucket: "cents-fe1c4.firebasestorage.app",
    messagingSenderId: "812679289010",
    appId: "1:812679289010:android:ccabb11816a82e8d6551ab"
};

// 1. Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Auth & Firestore
// We use the standard getAuth here to ensure the Bundler can resolve it
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, GoogleAuthProvider };