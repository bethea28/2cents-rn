import React, { useEffect, useState } from "react";
import {
  Button,
  Alert,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
} from "react-native";
import { useForm, Controller } from "react-hook-form";

import { setUserState } from "@/store/globalState/globalState";
import { useDispatch } from "react-redux";
import { useGoogleAuthMutation, useAuthLoginMutation } from "@/store/api/api";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import { useAuthTokens } from "@/app/customHooks";
import { useNavigation } from "@react-navigation/native";
import { login } from "@/store/authReducer";
import { authTokenStore } from "@/app/customHooks";

export function SocialLoginScreen() {
  const dispatch = useDispatch();
  const [googleSignIn] = useGoogleAuthMutation();
  const [regularSignIn] = useAuthLoginMutation();
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();
  const [errorMessage, setErrorMessage] = useState("");
  const { storeTokens } = useAuthTokens();
  const navigation = useNavigation();

  const onSubmit = async (data) => {
    const { email, password } = data;
    console.log("emails and all", email, password);
    try {
      const response = await regularSignIn(data);
      console.log("Sign In Response:", response?.data);
      if (response?.data?.token && response?.data?.refreshToken) {
        console.log("if response work ");
        authTokenStore.storeTokens(
          response?.data.token,
          response?.data.refreshToken
        );
        dispatch(login(response?.data.user));
        dispatch(setUserState(response?.data.user)); // Assuming your setUserState expects the user object
        // await storeTokens(response?.data.token, response?.data.refreshToken);
        setErrorMessage("Login successful!");
        // Navigate to your main app screen here
        // navigation.navigate("Home"); // Replace 'MainApp' with your actual screen name
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setErrorMessage("Login failed: " + (err.message || "Network error"));
    }
  };

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "389796448834-lokv2d5vt75qbshil74f1t6c8hrajm48.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }, []);
  const handleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      // const req = response.json();
      const fullUserResponse = await googleSignIn(response);
      // const decode = jwt_decode(jwtResponse.data.tokens.access);
      console.log("NEW RESPONSE OBJH", fullUserResponse);
      // console.log("NEW test", decode);
      const formattedJwt = fullUserResponse.data;
      // storeData("tokens", formattedJwt);
      dispatch(setUserState(fullUserResponse));
    } catch (error) {
      handleSignInError(error);
    }
  };

  const handleSignInError = (error) => {
    let message = "An unknown error occurred. Please try again.";
    if (error.code) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          message = "Sign-in was cancelled by the user.";
          break;
        case statusCodes.IN_PROGRESS:
          message = "Sign-in is already in progress.";
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          message = "Google Play Services is not available or outdated.";
          break;
        default:
          message = "An error occurred: " + error.message;
      }
    }
    Alert.alert("Sign-In Error", message);
  };
  // const tokens = getData();
  console.log("here are tokens now");
  //   return (
  //     <View style={{ padding: 20 }}>
  //       <Button title="Login with Google" onPress={handleSignIn} />
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Controller
        name="email"
        control={control}
        defaultValue=""
        rules={{
          required: "Email is required",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Invalid email format",
          },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <Controller
        name="password"
        control={control}
        defaultValue=""
        rules={{ required: "Password is required" }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={true}
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.password && (
        <Text style={styles.error}>{errors.password.message}</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text>Don't have an account? </Text>
        <TouchableOpacity
          onPress={() => {
            // Navigate to your signup screen here
            console.log("Navigate to signup");
          }}
        >
          <Text style={styles.signupLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 10, // Reduced marginBottom due to error message
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginBottom: 5,
  },
  signupContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  signupLink: {
    color: "#007bff",
    fontWeight: "bold",
  },
});
