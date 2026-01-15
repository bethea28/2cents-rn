import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NotifierWrapper } from "react-native-notifier";
import Constants from "expo-constants";
import * as Notifications from 'expo-notifications';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Toast from 'react-native-toast-message';
// Store & Screen Imports
import { store, persistor } from "../store/store";
import { increment } from "@/store/globalState/globalState";
import { useRegisterPushTokenMutation } from "@/store/api/api";

// Screen Imports (Add/Remove based on your actual file paths)
import { HomeScreen } from "./Screens/HomeScreen";
import { ChallengesScreen } from "./Screens/ChallengesScreen";
import { ProfileScreen } from "./Screens/ProfileScreen";
import { UserFeedbackScreen } from "./Screens/UserFeedbackScreen";
import { SocialLoginScreen } from './Screens/SocialLoginScreen';
import { FullStoryScreen } from "./Screens/FullStoryScreen";
// ... (Include your other screens here)

// 🛡️ Global Notification Config
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldPlaySound: false,
//     shouldShowBanner: true,
//   }),
// });
const BottomTab = createBottomTabNavigator();
const StackNav = createNativeStackNavigator();

/**
 * 🥩 S8 TOKEN GENERATOR
 */

async function registerForPushNotificationsAsync() {
  let token;
  console.log("🔍 [DEBUG] 1. Starting Token Process...");
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  console.log("🔍 [DEBUG] 2. Current Permission Status:", existingStatus);

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log("🔍 [DEBUG] 3. Requested Permission Status:", finalStatus);
  }

  if (finalStatus !== 'granted') {
    alert('Permission not granted! Go to S8 Settings > Apps > Arena > Notifications');
    return null;
  }

  // 🥩 THE BIG CULPRIT: The Project ID
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
  console.log("🔍 [DEBUG] 4. Project ID found:", projectId);

  if (!projectId) {
    alert("Project ID missing! You must have this in app.json under expo.extra.eas.projectId");
    return null;
  }

  try {
    console.log("🔍 [DEBUG] 5. Requesting Token from Expo...");
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("🥩 S8 PUSH TOKEN OBTAINED:", token);
  } catch (e) {
    console.log("❌ [DEBUG] 6. Expo Token Error:", e);
  }

  return token;
}

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  offlineAccess: true,
});

/**
 * 🛡️ NAVIGATION STRUCTURES
 */
function MyBottomTabs() {
  const navigation = useNavigation<any>();
  return (
    <BottomTab.Navigator screenOptions={{
      tabBarStyle: { backgroundColor: '#000' },
      headerStyle: { backgroundColor: '#000' },
      headerTintColor: '#fff'
    }}>
      <BottomTab.Screen name="Feed" component={HomeScreen} options={{
        headerRight: () => (
          <Pressable onPress={() => navigation.navigate("AddStory")} style={{ paddingVertical: 8, paddingHorizontal: 15, marginRight: 10, borderRadius: 20, backgroundColor: "#a349a4" }}>
            <Text style={{ color: "white", fontWeight: 'bold' }}>Add Story</Text>
          </Pressable>
        ),
      }} />
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
      <StackNav.Screen name="FullStoryScreen" component={FullStoryScreen} options={{ presentation: 'fullScreenModal' }} />
      {/* Add other stack screens here */}
    </StackNav.Navigator>
  );
}

/**
 * 🛡️ MAIN APP LOGIC
 */
function MainApp() {
  const dispatch = useDispatch();
  const userAuth = useSelector((state: any) => state.auth);
  const notificationListener = useRef<any>();
  const [registerPushToken] = useRegisterPushTokenMutation();

  useEffect(() => {
    dispatch(increment({ value: 20 }));
    console.log(' my user is HERE tommy', userAuth?.user?.user?.id)
    if (userAuth?.user?.user?.id) {

      registerForPushNotificationsAsync().then(async (token) => {
        if (token) {
          console.log(' here is my token GOD', token)
          try {
            // 🥩 The Handshake: Using Redux to update the DB via ngrok
            await registerPushToken({
              userId: userAuth?.user?.user?.id,
              token: token
            }).unwrap();
            console.log("✅ S8 Token synced successfully to Backend");
          } catch (err) {
            console.error("❌ Token Sync Failure:", err);
          }
        }
      });

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log("🔔 Notification Received in Foreground: GARY", notification);

        // 🥩 This is where the ear (Listener) tells the mouth (Toast) to speak
        Toast.show({
          type: 'success', // Use 'success' for that clean green look
          text1: notification.request.content.title || 'New Beef! 🥩',
          text2: notification.request.content.body || 'Something happened in the Arena.',
          position: 'top',
          visibilityTime: 4000,
        });
      });

      return () => {
        if (notificationListener.current) {
          // 🥩 STAFF FIX: Use the internal .remove() method
          notificationListener.current.remove();
          console.log("🧹 Notification listener cleaned up");
        }
      };
    }
  }, [userAuth?.user?.user?.id, registerPushToken, dispatch]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {userAuth?.user ? (
        <RootStack />
      ) : (
        <StackNav.Navigator screenOptions={{ headerShown: false }}>
          <StackNav.Screen name="SocialLogin" component={SocialLoginScreen} />
        </StackNav.Navigator>
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
            {/* 🥩 MainApp goes here as usual */}
            <MainApp />

            {/* 🥩 THE STAFF FIX: Place Toast here, AFTER your app content */}
            <Toast />
          </NotifierWrapper>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}