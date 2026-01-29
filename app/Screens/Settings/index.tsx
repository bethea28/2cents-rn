import React from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';

// 🛡️ LOGOUT IMPORTS
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import authSlice from "@/store/authReducer";
import { authTokenStore } from "@/app/customHooks";

export function Settings() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Grab user data to show who is currently logged in
  const currentUser = useSelector((state) => state.auth.user);

  const handleSignOut = async () => {
    try {
      // 1. Tell Google to drop the session (important for account switching)
      await GoogleSignin.signOut();

      // 2. Clear tokens from the phone's hardware storage
      await authTokenStore.clearTokens();

      // 3. 🛡️ THE KILL SWITCH: This triggers MainApp to swap to LoginScreen
      dispatch(authSlice.actions.logout());

      console.log("🛡️ STAFF LOG: State cleared, redirecting...");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: handleSignOut }
      ]
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settings</Text>

        {/* 🛡️ Balancer: Ensure there is NO space or text inside this View */}
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* USER PROFILE INFO */}
        <View style={styles.profileCard}>
          <Text style={styles.userName}>
            {currentUser?.username ? `@${currentUser.username}` : 'User'}
          </Text>
          {currentUser?.email && (
            <Text style={styles.userEmail}>{currentUser.email}</Text>
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>ACCOUNT ACTIONS</Text>

          <TouchableOpacity style={styles.logoutButton} onPress={confirmSignOut}>
            <Ionicons name="log-out-outline" size={22} color="red" style={styles.icon} />
            <Text style={styles.logoutText}>Sign Out of Google</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>2CENTS ARENA • v1.0.4</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  content: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  menuSection: {
    width: '100%',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    marginBottom: 10,
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  icon: {
    marginRight: 10,
  },
  logoutText: {
    color: "red",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  versionText: {
    color: "#ccc",
    fontSize: 11,
    fontWeight: '700',
  },
});