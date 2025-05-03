import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  Image,
  FlatList,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "react-native-image-picker";
import { useSelector, UseSelector } from "react-redux";
import { useCreateStoryMutation } from "@/store/api/api";
import { useAuthTokens } from "@/app/customHooks";
// Define the color palette (keeping it consistent)
const primaryColor = "#a349a4"; // Purple
const secondaryColor = "#FF8C00"; // Vibrant Orange
const backgroundColor = "#FFB347"; // Lighter Orange
const textColorPrimary = "#ffffff"; // White
const textColorSecondary = "#333333"; // Dark Gray
const inputBackgroundColor = textColorPrimary; // Assuming input fields are white
const buttonBackgroundColor = primaryColor;
const buttonTextColor = textColorPrimary;
const errorTextColor = "red";
const placeholderTextColor = "gray";

export function AddStoryForm() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      title: "",
      storyType: "one-sided", // Default value
      sideAContent: "",
      sideAVideoUrl: "",
      sideBContent: "",
      sideBVideoUrl: "",
    },
  });

  const navigation = useNavigation();
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [storyType, setStoryType] = useState("one-sided");
  const userState = useSelector((state) => state.counter.userState);
  const [createStory] = useCreateStoryMutation();
  const handleAddPhotos = () => {
    const options = {
      mediaType: "photo",
      quality: 0.8,
      allowsMultipleSelection: true,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.error) {
        console.log("ImagePicker Error: ", response.error);
      } else {
        const newPhotos = response.assets.map((asset) => ({ uri: asset.uri }));
        setSelectedPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
      }
    });
  };

  const renderSelectedPhoto = ({ item }) => (
    <View style={styles.selectedPhotoItem}>
      <Image source={{ uri: item.uri }} style={styles.selectedPhoto} />
      <Pressable
        onPress={() => {
          setSelectedPhotos((prevPhotos) =>
            prevPhotos.filter((photo) => photo.uri !== item.uri)
          );
        }}
        style={styles.removePhotoButton}
      >
        <Text style={styles.removePhotoText}>X</Text>
      </Pressable>
    </View>
  );

  const onSubmit = async (formData) => {
    const dataToSend = {
      ...formData,
      storyType,
      sideBId: 4,
      sideAId: userState.userId,
    };

    const story = {
      photos: selectedPhotos,
      userId: userState.userId,
      formData: dataToSend,
    };
    const createStoryRequest = await createStory(story);
    console.log("KYRIE IRVING", createStoryRequest);
    navigation.navigate("Home");
    // Your submission logic here, including sending dataToSend and selectedPhotos to the server
  };
  console.log("user data now", userState);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.storyTypeButtons}>
          <Pressable
            style={[
              styles.storyTypeButton,
              storyType === "one-sided" && styles.storyTypeButtonActive,
            ]}
            onPress={() => setStoryType("one-sided")}
          >
            <Text
              style={[
                styles.storyTypeText,
                storyType === "one-sided" && styles.storyTypeTextActive,
              ]}
            >
              One-Sided
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.storyTypeButton,
              storyType === "two-sided" && styles.storyTypeButtonActive,
            ]}
            onPress={() => setStoryType("two-sided")}
          >
            <Text
              style={[
                styles.storyTypeText,
                storyType === "two-sided" && styles.storyTypeTextActive,
              ]}
            >
              Two-Sided
            </Text>
          </Pressable>
        </View>

        <Controller
          control={control}
          rules={{ minLength: 3 }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder="Title (optional)"
              placeholderTextColor={placeholderTextColor}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              style={styles.input}
            />
          )}
          name="title"
        />
        {errors.title && (
          <Text style={styles.errorText}>
            Title must be at least 3 characters.
          </Text>
        )}

        <Controller
          control={control}
          rules={{ required: true, minLength: 10 }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder="Your Story (required)"
              placeholderTextColor={placeholderTextColor}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              style={[styles.input, styles.multilineInput]}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          )}
          name="sideAContent"
        />
        {errors.sideAContent && (
          <Text style={styles.errorText}>
            Your story is required and must be at least 10 characters.
          </Text>
        )}

        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder="Video URL (optional)"
              placeholderTextColor={placeholderTextColor}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              style={styles.input}
            />
          )}
          name="sideAVideoUrl"
        />

        {selectedPhotos && selectedPhotos.length > 0 && (
          <View style={styles.selectedPhotosPreview}>
            <Text style={styles.previewTitle}>Selected Photos:</Text>
            <FlatList
              data={selectedPhotos}
              renderItem={renderSelectedPhoto}
              keyExtractor={(item, index) => index.toString()}
              horizontal
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Pressable onPress={handleAddPhotos} style={styles.addPhotosButton}>
            <Text style={styles.addPhotosText}>Add Photos</Text>
          </Pressable>
          <Pressable
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.submitButtonText}>Submit Story</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  input: {
    height: 50,
    backgroundColor: inputBackgroundColor,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginTop: 10,
    color: textColorSecondary,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  errorText: {
    color: errorTextColor,
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 25,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  submitButton: {
    backgroundColor: buttonBackgroundColor,
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flex: 1,
    marginLeft: 10,
  },
  submitButtonText: {
    color: buttonTextColor,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  addPhotosButton: {
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: secondaryColor,
    width: "50%",
    paddingVertical: 15,
    justifyContent: "center",
    marginTop: 10,
    flex: 1,
    marginRight: 10,
  },
  addPhotosText: {
    color: buttonTextColor,
    padding: 10,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedPhotosPreview: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: textColorSecondary,
  },
  selectedPhotoItem: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  selectedPhoto: {
    width: "100%",
    height: "100%",
  },
  removePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  removePhotoText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  storyTypeButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    marginBottom: 15,
  },
  storyTypeButton: {
    borderWidth: 1,
    borderColor: textColorSecondary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  storyTypeButtonActive: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  storyTypeText: {
    color: textColorSecondary,
    fontSize: 16,
  },
  storyTypeTextActive: {
    color: textColorPrimary,
    fontWeight: "bold",
  },
});
