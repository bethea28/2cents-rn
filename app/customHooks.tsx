import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- 🔐 THE VAULT (Raw Strings for Tokens) ---
export const authTokenStore = {
  getAccessToken: async () => {
    return await AsyncStorage.getItem("accessToken");
  },
  getRefreshToken: async () => {
    return await AsyncStorage.getItem("refreshToken");
  },
  storeTokens: async (accessToken, refreshToken) => {
    if (!accessToken) return;
    await AsyncStorage.setItem("accessToken", accessToken);
    if (refreshToken) await AsyncStorage.setItem("refreshToken", refreshToken);
    console.log("🛡️ [Vault]: Tokens secured.");
  },
  clearTokens: async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
  }
};

// --- 📦 GENERAL STORAGE (For Objects/JSON) ---
export const useAsyncStorage = () => {
  const storeData = async (key, value) => {
    try {
      const finalVal = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, finalVal);
    } catch (e) { console.error("Store error", e); }
  };

  const getData = async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) { return null; }
  };
  return [storeData, getData];
};

// --- 📸 IMAGE PICKER ---
export const useImagePicker = () => {
  const [allImages, setAllImages] = useState([]);
  const [error, setError] = useState(null);

  const pickImages = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: true,
      });
      if (!result.canceled) setAllImages(result.assets);
    } catch (err) { setError(err); }
  };
  return { pickImages, allImages, error };
};

// --- ⏰ UTILS ---
export const timeConvert = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
};