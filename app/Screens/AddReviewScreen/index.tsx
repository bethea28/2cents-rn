import React from "react";
import {
  Text,
  View,
  TextInput,
  Button,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Platform,
  Easing, // Import Easing if you haven't already
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useAddReviewMutation } from "@/store/api/api";
import StarRating from "react-native-star-rating-widget";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
// import { StackActions } from "@react-navigation/native"; // No longer directly needed with goBack
import { Notifier } from "react-native-notifier";

const StarRate = ({ changeRating, rating, styles }) => {
  return <StarRating style={styles} rating={rating} onChange={changeRating} />;
};

export function AddReviewScreen({ route: { params } }) {
  const [addReview] = useAddReviewMutation();
  const [rating, setRating] = React.useState(0);
  const navigation = useNavigation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      review: "",
    },
  });
  const userData = useSelector((state) => state.counter.userState);
  console.log("this was passion now bryan bethea", params);

  const onSubmit = async (data) => {
    try {
      const final = {
        review: data.review,
        rating,
        userId: userData.data.user.user_id,
        companyId: params.companyInfo.companyId,
      };
      const request = await addReview(final);
      // Ensure the addReview mutation was successful before navigating back
      if (request?.data.message.includes("created")) {
        await Notifier.showNotification({
          description: "Review was successfully added!",
          duration: 3000, // Increased duration for better visibility
          swipeEnabled: true,
          hideOnPress: true,
          showAnimationDuration: 300, // Reduced for snappier animation
          showEasing: Easing.ease, // Using a standard ease
        });
        navigation.goBack();
      } else {
        // Handle the case where adding the review failed
        console.log("Failed to add review:", request?.error);
        Notifier.showNotification({
          description: "Failed to add review. Please try again.",
          duration: 5000,
          backgroundStyle: { backgroundColor: "red" },
        });
      }
    } catch (error) {
      console.log("error", error);
      Notifier.showNotification({
        description: `Error adding review: ${error.message}`,
        duration: 5000,
        backgroundStyle: { backgroundColor: "orange" },
      });
    } finally {
      reset();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }} // Ensure KeyboardAvoidingView takes full height
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }} // Ensure ScrollView takes full height
      >
        <Controller
          control={control}
          rules={{
            required: "Review text is required.", // More user-friendly message
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder="Add a review!"
              placeholderTextColor="gray" // More standard color
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              style={styles.textInput}
              multiline={true}
              textAlignVertical="top"
            />
          )}
          name="review"
        />
        {errors.review && (
          <Text style={styles.errorText}>{errors.review.message}</Text>
        )}
        <View style={styles.ratingAndButtonContainer}>
          <StarRate
            styles={styles.starRating}
            rating={rating}
            changeRating={setRating}
          />
          <Button
            color="blue"
            title="Submit"
            onPress={handleSubmit(onSubmit)}
            disabled={!rating} // Disable submit if no rating is given
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  textInput: {
    flexGrow: 1, // Allow TextInput to grow and take available space
    backgroundColor: "#f0f0f0", // Light background for better readability
    borderRadius: 10, // More subtle rounded corners
    padding: 15,
    marginBottom: 15,
    minHeight: 150, // Increased minHeight for better writing area
    textAlignVertical: "top",
    color: "black", // Ensure text is visible
  },
  ratingAndButtonContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  starRating: {
    marginTop: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
});
