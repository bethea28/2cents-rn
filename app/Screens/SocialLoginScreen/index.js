import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/store/api/firebaseConfig"; // Our fixed config
// 1. Import the actions from your slice file
import { setUser, clearUser } from "@/store/authSlice"; // Adjust path to where your slice lives

// 2. Inside your component, get the dispatch function
// import { useAppDispatch } from "@/store/hooks";
import { useSelector } from "react-redux";
import { useDispatch, } from "react-redux";
import { useAuthRegisterMutation } from "@/store/api/api";

export function SocialLoginScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [register] = useAuthRegisterMutation();

  const dispatch = useDispatch()
  // const [loginApi, { isLoading }] = useAuthLoginMutation();


  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();

      // 1. Log the raw response from Google
      const response = await GoogleSignin.signIn();
      console.log("LOG 1: Raw Google Response:", JSON.stringify(response, null, 2));

      // 2. Extract and log the token
      const idToken = response.data?.idToken || response.idToken;
      console.log("LOG 2: Extracted ID Token:", idToken ? "✅ Received" : "❌ MISSING");

      if (!idToken) {
        throw new Error("No ID Token found. Google did not issue a credential.");
      }

      // 3. Create and log the Firebase credential object
      const credential = GoogleAuthProvider.credential(idToken);
      // console.log("LOG 3: Firebase Credential Object Created:", credential);

      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      console.log('ALL USER', user.uid)
      const formData = new FormData();
      formData.append('uid', user.uid);
      formData.append('email', user.email.toLowerCase().trim());
      formData.append('photoUrl', user.photoURL);
      formData.append('displayName', user.displayName);
      const done = await register(formData).unwrap();

      // ✅ The "Honest" Dispatch: Update Redux with the Firebase user data

      dispatch(setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }));



    } catch (error) {
      console.error("LOG 4: Google Login Error Trace:", error);
      dispatch(clearUser());
      // ... rest of your catch block
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>RESUME THE BATTLE</Text>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBanner}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.descriptionWrapper}>
          <Text style={styles.descriptionText}>
            Sign in with your Google account to claim your handle and enter the Arena.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.battleButton, isLoading && { opacity: 0.7 }]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>SIGN IN WITH GOOGLE</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Registration")}
          style={styles.footerLink}
        >
          <Text style={styles.footerText}>
            Issues accessing? <Text style={styles.linkText}>Contact Support</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scrollContent: { padding: 25, justifyContent: "center", flexGrow: 1 },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 20, letterSpacing: 1 },
  descriptionWrapper: { marginBottom: 40, alignItems: 'center' },
  descriptionText: { color: '#888', textAlign: 'center', fontSize: 14, lineHeight: 20 },
  battleButton: { backgroundColor: "#a349a4", padding: 18, borderRadius: 10, alignItems: "center", marginTop: 15 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  errorBox: { backgroundColor: 'rgba(255,0,0,0.05)', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,0,0,0.1)' },
  errorBanner: { color: "#FF4444", textAlign: "center", fontSize: 13, fontWeight: '600' },
  footerLink: { marginTop: 30, alignItems: 'center' },
  footerText: { color: '#444', fontSize: 13 },
  linkText: { color: '#a349a4', fontWeight: 'bold' }
});