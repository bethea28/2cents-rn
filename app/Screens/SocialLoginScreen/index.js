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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/store/api/firebaseConfig";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "@/store/authSlice";
import { useGoogleSyncMutation } from "@/store/api/api"; // Ensure this matches your API slice
import { authTokenStore } from "@/app/customHooks"; // Adjust path if needed
export function SocialLoginScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 🛡️ STAFF TIP: Use the specific GoogleSync mutation
  const [googleSync] = useGoogleSyncMutation();
  const dispatch = useDispatch();

  const handleGoogleLogin = async () => {
    console.log('sersi')
    // return
    setErrorMessage("");
    setIsLoading(true);

    try {
      // 1. Ensure Play Services are available
      await GoogleSignin.hasPlayServices();

      // 2. Trigger Google Sign-In UI
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken || response.idToken;
      console.log('RESPONSE GOOGLE', response)
      // return
      if (!idToken) throw new Error("Google Identity Token missing.");

      // 3. Authenticate with Firebase
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const { user: firebaseUser } = userCredential;

      // 4. 🛡️ Sync with your Postgres Backend
      // We send a clean JSON object, NOT FormData
      const syncData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email.toLowerCase().trim(),
        photoURL: firebaseUser.photoURL,
        displayName: firebaseUser.displayName,
      };

      // .unwrap() allows us to catch backend errors in the 'catch' block below
      console.log('result craig before')
      const result = await googleSync(syncData).unwrap();
      console.log('result craig', result)
      // 5. Update Redux with YOUR Database user + JWT Token
      if (result.token) {
        await authTokenStore.storeTokens(result.token, result.refreshToken || "");
        console.log("✅ Tokens committed to vault");
      }

      dispatch(setUser({
        user: result.user,
        token: result.token,
      }));

      // 6. Navigation Logic
      // if (result.isNewUser) {
      //   // Send to Username Selection if it's their first time
      //   navigation.navigate("OnboardingUsername");
      // } else {
      //   // Go straight to the Arena
      //   navigation.replace("MainTabs");
      // }

    } catch (error) {
      console.error("LOG 4: Google Login Error Trace:", error);
      dispatch(clearUser());

      // Handle the "Cancel" case vs a real error
      if (error.code !== "SIGN_IN_CANCELLED") {
        setErrorMessage(error.data?.error || "The Arena gates are jammed. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
              Prefer email? <Text style={styles.linkText}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1 },
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