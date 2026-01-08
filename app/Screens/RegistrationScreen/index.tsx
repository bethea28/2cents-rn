import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useDispatch } from "react-redux";
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons";

// Your existing logic imports (UNCHANGED)
import { setUserState } from "@/store/globalState/globalState";
import { useAuthRegisterMutation } from "@/store/api/api";
import { login } from "@/store/authReducer";
import { authTokenStore } from "@/app/customHooks";
// Add useNavigation to your imports from react-navigation
import { useNavigation } from "@react-navigation/native";
export function RegistrationScreen() {
  const navigation = useNavigation<any>(); // Initialize it here
  const dispatch = useDispatch();
  const [register, { isLoading }] = useAuthRegisterMutation();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  // 🛠️ Handles the optional profile pic logic per your model
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Arena access requires gallery permissions for profile icons!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: any) => {
    setErrorMessage("");
    const formData = new FormData();
    formData.append('username', data.username.trim());
    formData.append('email', data.email.toLowerCase().trim());
    formData.append('password', data.password);

    if (profileImage) {
      const filename = profileImage.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('profilePic', {
        uri: profileImage,
        name: filename || 'profile.jpg',
        type,
      } as any);
    }

    try {
      const response: any = await register(formData).unwrap();

      if (response?.token) {
        // 1. Store tokens
        authTokenStore.storeTokens(response.token, response.refreshToken);

        // 2. Update State (This triggers the screen swap in MainApp)
        dispatch(login(response.user));
        dispatch(setUserState(response.user));

        // 🛡️ STAFF TIP: REMOVE navigation.navigate('Feed')
        // The MainApp conditional rendering {user ? <Feed /> : <Auth />} 
        // handles this for you. Calling navigate manually here 
        // causes the "not handled by any navigator" crash.
      }
    } catch (err: any) {
      // This catch block will now receive the error if the server sends HTML
      const backendError = err?.data?.message || err?.error || "Registration failed.";
      setErrorMessage(typeof backendError === 'string' ? backendError : "System Error");
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
        <Text style={styles.title}>CLAIM YOUR HANDLE</Text>

        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#444" />
              <Text style={styles.avatarText}>TAP TO UPLOAD</Text>
            </View>
          )}
        </TouchableOpacity>

        {errorMessage ? <View style={styles.errorBox}><Text style={styles.errorBanner}>{errorMessage}</Text></View> : null}

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>BATTLE TAG</Text>
          <Controller
            name="username"
            control={control}
            defaultValue=""
            rules={{
              required: "Username is required",
              minLength: { value: 3, message: "Username too short" },
              maxLength: { value: 30, message: "Username too long" },
              pattern: { value: /^[a-zA-Z0-9_]+$/, message: "No spaces or special characters" }
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="Ex: TrashTalker_01"
                placeholderTextColor="#333"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
              />
            )}
          />
          {errors.username && <Text style={styles.errorText}>{String(errors.username.message)}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>EMAIL</Text>
          <Controller
            name="email"
            control={control}
            defaultValue=""
            rules={{
              required: "Email is required",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" }
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="email@arena.com"
                placeholderTextColor="#333"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{String(errors.email.message)}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>SECRET KEY</Text>
          <Controller
            name="password"
            control={control}
            defaultValue=""
            rules={{
              required: "Password is required",
              minLength: { value: 6, message: "Must be at least 6 characters" }
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor="#333"
                secureTextEntry
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{String(errors.password.message)}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.battleButton, isLoading && { opacity: 0.7 }]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ENTER ARENA</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.footerLink}>
          <Text style={styles.footerText}>Already a fighter? <Text style={styles.linkText}>Login</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scrollContent: { padding: 25, justifyContent: "center", flexGrow: 1 },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 30, letterSpacing: 1 },

  // Avatar Styles
  avatarContainer: { alignSelf: 'center', marginBottom: 25 },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#0A0A0A', borderWidth: 1, borderStyle: 'dashed', borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: '#a349a4' },
  avatarText: { color: '#444', fontSize: 10, marginTop: 8, fontWeight: '900' },

  // Input Styles
  inputWrapper: { marginBottom: 18, width: '100%' },
  label: { color: '#444', fontSize: 11, fontWeight: '900', marginBottom: 8, marginLeft: 4, letterSpacing: 1 },
  input: { backgroundColor: "#0A0A0A", color: "#fff", padding: 16, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#1A1A1A' },
  inputError: { borderColor: '#550000' },

  // Button Styles
  battleButton: { backgroundColor: "#a349a4", padding: 18, borderRadius: 10, alignItems: "center", marginTop: 15 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 1 },

  // Feedback & Footer
  errorBox: { backgroundColor: 'rgba(255,0,0,0.05)', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,0,0,0.1)' },
  errorBanner: { color: "#FF4444", textAlign: "center", fontSize: 13, fontWeight: '600' },
  errorText: { color: "#FF4444", fontSize: 11, marginTop: 5, fontWeight: '600' },
  footerLink: { marginTop: 25, alignItems: 'center' },
  footerText: { color: '#444', fontSize: 13 },
  linkText: { color: '#a349a4', fontWeight: 'bold' }
});