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
import * as Linking from 'expo-linking';

// Store & Screen Imports
import { store, persistor } from "../store/store";
import { useRegisterPushTokenMutation } from "@/store/api/api";
import { VideoProvider } from './Components/VideoProvider';

// Screen Imports
import { HomeScreen } from "./Screens/HomeScreen";
import { ChallengesScreen } from "./Screens/ChallengesScreen";
import { ChallengeDetailsScreen } from "./Screens/ChallengeDetailsScreen";
import { ProfileScreen } from "./Screens/ProfileScreen";
import { Settings } from "./Screens/Settings";
import { SocialLoginScreen } from './Screens/SocialLoginScreen';
import { FullStoryScreen } from "./Screens/FullStoryScreen";
import { registerRootComponent } from 'expo';

// 🛡️ Global Notification Config
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const BottomTab = createBottomTabNavigator();
const StackNav = createNativeStackNavigator();

// 🛡️ Smler & Deep Link Config
const linking = {
    prefixes: [
        Linking.createURL('/'),
        'twocents://',          // 🏠 Your new custom scheme
        'https://smler.in',     // 🚐 Smler's default "shuttle" domain
        'https://smler.io'
    ],
    config: {
        screens: {
            HomeTab: {
                screens: {
                    Feed: 'feed',
                    Challenges: 'challenges',
                    Profile: 'profile',
                    Settings: 'settings',
                }
            },
            // 🛡️ Maps smler.in/xyz -> FullStoryScreen
            FullStoryScreen: 'story/:storyId',
            ChallengeDetailsScreen: 'challenge/:id',
        },
    },
};

/**
 * 🥩 TOKEN GENERATOR (PUSH)
 */
async function registerForPushNotificationsAsync() {
    let token;
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

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
    if (!projectId) return null;

    try {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
        console.log("❌ Expo Token Error:", e);
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
    const navigation = useNavigation < any > ();
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
            <BottomTab.Screen name="Settings" component={Settings} />
        </BottomTab.Navigator>
    );
}

function RootStack() {
    return (
        <StackNav.Navigator>
            <StackNav.Screen name="HomeTab" component={MyBottomTabs} options={{ headerShown: false }} />
            <StackNav.Screen name="FullStoryScreen" component={FullStoryScreen} options={{ presentation: 'fullScreenModal', headerShown: false }} />
            <StackNav.Screen name="ChallengeDetailsScreen" component={ChallengeDetailsScreen} />
        </StackNav.Navigator>
    );
}

/**
 * 🛡️ MAIN APP LOGIC (The Switcher)
 */
function MainApp() {
    const [registerPushToken] = useRegisterPushTokenMutation();

    // 🛡️ Gatekeeper check
    const auth = useSelector((state: any) => state.auth);
    const userObj = auth?.user;
    const token = userObj?.token;
    const actualUserId = userObj?.user?.id;

    useEffect(() => {
        if (token && actualUserId) {
            registerForPushNotificationsAsync().then(pushToken => {
                if (pushToken) registerPushToken({ userId: actualUserId, token: pushToken });
            });
        }
    }, [actualUserId, token]);

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            {token && actualUserId ? (
                <RootStack />
            ) : (
                <StackNav.Navigator screenOptions={{ headerShown: false }}>
                    <StackNav.Screen name="SocialLogin" component={SocialLoginScreen} />
                </StackNav.Navigator>
            )}
        </View>
    );
}

/**
 * 🛡️ ROOT EXPORT
 */
export default function App() {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <NotifierWrapper>
                        <VideoProvider>
                            <NavigationContainer linking={linking} fallback={<Text style={{ color: 'white' }}>Loading Arena...</Text>}>
                                <MainApp />
                            </NavigationContainer>
                        </VideoProvider>
                        <Toast />
                    </NotifierWrapper>
                </GestureHandlerRootView>
            </PersistGate>
        </Provider>
    );
}

registerRootComponent(App);