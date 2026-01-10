






import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NotifierWrapper } from "react-native-notifier";
import Constants from "expo-constants";

// Store Imports
import { store, persistor } from "../store/store";
import { increment } from "@/store/globalState/globalState";

// Screen Imports
import { RegistrationScreen } from "./Screens/RegistrationScreen";
import { LoginScreen } from './Screens/LoginScreen';
import { SocialLoginScreen } from './Screens/SocialLoginScreen';
import { HomeScreen } from "./Screens/HomeScreen";
import { ProfileScreen } from "./Screens/ProfileScreen";
import { ChallengesScreen } from "./Screens/ChallengesScreen";
import { UserFeedbackScreen } from "./Screens/UserFeedbackScreen";
import { FullStoryScreen } from "./Screens/FullStoryScreen";
import { AddStoryScreen } from "./Screens/AddStoryScreen";
import { DetailsScreen } from "./Screens/DetailsScreen";
import { ChallengeDetailsScreen } from "./Screens/ChallengeDetailsScreen";
import { InfoScreen } from "./Screens/InfoScreen";
import { BusinessHours } from "./Screens/BusinessHours";
import { AddReviewScreen } from "./Screens/AddReviewScreen";
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const BottomTab = createBottomTabNavigator();
const StackNav = createNativeStackNavigator();


GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID, // From your .env
  offlineAccess: true,
});

// --- TABS (The "Arena" Inner Sanctum) ---
function MyBottomTabs() {
  const navigation = useNavigation<any>();
  return (
    <BottomTab.Navigator screenOptions={{
      tabBarStyle: { backgroundColor: '#000' },
      headerStyle: { backgroundColor: '#000' },
      headerTintColor: '#fff'
    }}>
      <BottomTab.Screen
        name="Feed"
        component={HomeScreen}
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("AddStory")}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 15,
                marginRight: 10,
                borderRadius: 20,
                backgroundColor: "#a349a4",
              }}
            >
              <Text style={{ color: "white", fontWeight: 'bold' }}>Add Story</Text>
            </Pressable>
          ),
        }}
      />
      <BottomTab.Screen name="Challenges" component={ChallengesScreen} />
      <BottomTab.Screen name="Profile" component={ProfileScreen} />
      <BottomTab.Screen name="Feedback" component={UserFeedbackScreen} />
    </BottomTab.Navigator>
  );
}

// --- MAIN CONTENT STACK ---
function RootStack() {
  return (
    <StackNav.Navigator>
      <StackNav.Screen
        name="HomeTab"
        component={MyBottomTabs}
        options={{ headerShown: false }}
      />
      <StackNav.Screen
        name="FullStoryScreen"
        component={FullStoryScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <StackNav.Screen name="AddStory" component={AddStoryScreen} />
      <StackNav.Screen name="Details" component={DetailsScreen} />
      <StackNav.Screen name="ChallengeDetailsScreen" component={ChallengeDetailsScreen} />
      <StackNav.Screen name="Info" component={InfoScreen} />
      <StackNav.Screen name="BusinessHours" component={BusinessHours} />
      <StackNav.Screen name="AddReviews" component={AddReviewScreen} />
    </StackNav.Navigator>
  );
}

// --- MAIN APP COMPONENT ---
// --- MAIN APP COMPONENT ---
function MainApp() {
  const dispatch = useDispatch();
  const userAuth = useSelector((state: any) => state.auth);

  useEffect(() => {
    dispatch(increment({ value: 20 }));
    // console.log("Current User Auth Status:", userAuth.user.uid);
  }, [dispatch, userAuth]);

  // 🛡️ STAFF TIP: Remove <NavigationContainer> here. 
  // Expo Router / Root Layout already provides one.
  console.log('SIGN IN NOW', userAuth)
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {userAuth?.user ? (
        /* Show the Arena */
        <RootStack />
      ) : (
        /* Show the Auth Stack */
        <StackNav.Navigator screenOptions={{ headerShown: false }}>
          {/* <StackNav.Screen name="Registration" component={RegistrationScreen} /> */}
          {/* <StackNav.Screen name="Login" component={LoginScreen} /> */}
          <StackNav.Screen name="SocialLogin" component={SocialLoginScreen} />
        </StackNav.Navigator>
      )}
    </View>
  );
}

// --- ENTRY POINT ---
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NotifierWrapper>
            <MainApp />
          </NotifierWrapper>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}