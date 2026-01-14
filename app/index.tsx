import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Text, Pressable, Platform } from "react-native";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NotifierWrapper } from "react-native-notifier";
import Constants from "expo-constants";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Store & Screen Imports
import { store, persistor } from "../store/store";
import { increment } from "@/store/globalState/globalState";
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

// 🛡️ Global Notification Config
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const BottomTab = createBottomTabNavigator();
const StackNav = createNativeStackNavigator();

// 🛡️ Token Generation Logic



async function registerForPushNotificationsAsync() {
  let token;

  // 1. Setup the "Pipe" for Android (Required for S8)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 2. Ask for Permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Permission not granted! Check S8 Settings.');
    return;
  }

  // 3. GET THE TOKEN (The Fix)
  // Get the ID from your app.json (extra -> eas -> projectId)
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId
    || Constants?.easConfig?.projectId;

  if (!projectId) {
    alert("Project ID missing! Check app.json");
    return;
  }

  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("🥩 S8 TOKEN:", token);
    alert("TOKEN FOUND: " + token); // This will show on the phone screen
  } catch (e) {
    console.log("❌ Token Error:", e);
  }

  return token;
}
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  offlineAccess: true,
});

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
              style={{ paddingVertical: 8, paddingHorizontal: 15, marginRight: 10, borderRadius: 20, backgroundColor: "#a349a4" }}
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

function RootStack() {
  return (
    <StackNav.Navigator>
      <StackNav.Screen name="HomeTab" component={MyBottomTabs} options={{ headerShown: false }} />
      <StackNav.Screen name="FullStoryScreen" component={FullStoryScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <StackNav.Screen name="AddStory" component={AddStoryScreen} />
      <StackNav.Screen name="Details" component={DetailsScreen} />
      <StackNav.Screen name="ChallengeDetailsScreen" component={ChallengeDetailsScreen} />
      <StackNav.Screen name="Info" component={InfoScreen} />
      <StackNav.Screen name="BusinessHours" component={BusinessHours} />
      <StackNav.Screen name="AddReviews" component={AddReviewScreen} />
    </StackNav.Navigator>
  );
}

function MainApp() {
  const dispatch = useDispatch();
  const userAuth = useSelector((state: any) => state.auth);
  const notificationListener = useRef<any>();

  useEffect(() => {
    dispatch(increment({ value: 20 }));

    if (userAuth?.user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          // 🛡️ Sync the token to your backend automatically
          fetch('http://172.20.10.4:5001/auth/sync-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userAuth.user.id, // Ensure this matches your user object
              pushToken: token,
            }),
          })
            .then(() => console.log("✅ Token synced to server"))
            .catch(err => console.log("❌ Sync failed:", err));
        }
      });

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log("Notification Received:", notification);
      });

      return () => {
        notificationListener.current?.remove();
      };
    }
  }, [dispatch, userAuth]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {userAuth?.user ? (
        // <NavigationContainer>
        <RootStack />
        // </NavigationContainer>
      ) : (
        // <NavigationContainer> 
        <StackNav.Navigator screenOptions={{ headerShown: false }}>
          <StackNav.Screen name="SocialLogin" component={SocialLoginScreen} />
        </StackNav.Navigator>
        // </NavigationContainer>
      )}
    </View>
  );
}

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