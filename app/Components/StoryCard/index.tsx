import * as React from "react";
import {
  View,
  StyleSheet,
  Text,
  ImageBackground,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const primaryColor = "#a349a4";
const primaryLightColor = "#d67bff";
const primaryDarkColor = "#751976";
const textColorPrimary = "#ffffff";
const textColorSecondary = "#333333";
const surfaceColor = "#FFFFFF";

export const StoryCard = ({ item }) => {
  const navigation = useNavigation();

  return (
    <Pressable
      onPress={() => navigation.navigate("FullStoryScreen", { story: item })}
      style={({ pressed }) => [
        { backgroundColor: pressed ? primaryColor : primaryLightColor },
      ]}
    >
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>Type: {item.storyType}</Text>
        <Text style={styles.subtitle}>Status: {item.status}</Text>
        <Text style={styles.body}>
          {item.sideAContent || "No content available."}
        </Text>
      </View>

      <ImageBackground
        style={[styles.cover, { justifyContent: "flex-end" }]}
        source={{
          uri: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80",
        }}
      >
        {/* <Pressable
          onPress={handleNavigate}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? primaryLightColor : primaryColor },
          ]}
        >
          <Text style={styles.buttonText}>View Story</Text>
        </Pressable> */}
      </ImageBackground>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    // backgroundColor: surfaceColor,
    borderRadius: 8,
    elevation: 2,
    marginVertical: 12,
    overflow: "hidden",
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: textColorSecondary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: textColorSecondary,
    marginBottom: 2,
  },
  body: {
    fontSize: 16,
    color: textColorSecondary,
    marginTop: 8,
  },
  cover: {
    // height: 180,
    width: "100%",
    padding: 12,
  },
  button: {
    alignSelf: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  buttonText: {
    color: textColorPrimary,
    fontWeight: "bold",
    fontSize: 16,
  },
});
