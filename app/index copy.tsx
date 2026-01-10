import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NotifierWrapper } from "react-native-notifier";
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Store Imports
import { store, persistor } from "../store/store";

// ... Your Screen Imports ...

const BottomTab = createBottomTabNavigator();
const StackNav = createNativeStackNavigator();

// 🛡️ STAFF TIP: Initialize Google once at the start of the house
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID, // From your .env
  offlineAccess: true,
});

function MyBottomTabs() {
  const navigation = useNavigation();
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
    </BottomTab.Navigator>
  );
}

function RootStack() {
  return (
    <StackNav.Navigator>
      <StackNav.Screen name="HomeTab" component={MyBottomTabs} options={{ headerShown: false }} />
      <StackNav.Screen name="FullStoryScreen" component={FullStoryScreen} options={{ presentation: 'fullScreenModal' }} />
      <StackNav.Screen name="AddStory" component={AddStoryScreen} />
      {/* ... other screens ... */}
    </StackNav.Navigator>
  );
}

function MainApp() {
  const userAuth = useSelector((state) => state.auth.user);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {userAuth?.userId ? (
        <RootStack />
      ) : (
        <StackNav.Navigator screenOptions={{ headerShown: false }}>
          <StackNav.Screen name="Login" component={LoginScreen} />
          <StackNav.Screen name="Registration" component={RegistrationScreen} />
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
            <MainApp />
          </NotifierWrapper>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}

