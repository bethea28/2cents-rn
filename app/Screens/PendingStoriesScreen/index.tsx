import React, { useState } from "react";
import {
  Text,
  FlatList,
  RefreshControl,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useGetAllPendingStoriesQuery } from "@/store/api/api"; // Using the API query hook
import { useSelector } from "react-redux";

// Define color scheme
const primaryColor = "#a349a4"; // Purple 500
const primaryLightColor = "#d67bff"; // Purple 200
const primaryDarkColor = "#751976"; // Purple 700
const secondaryColor = "#f28e1c"; // Orange A200
const secondaryLightColor = "#ffc04f"; // Orange A100
const secondaryDarkColor = "#b95f00"; // Orange A400
const backgroundColor = "#f7b767"; // Light Orange 200
const textColorPrimary = "#ffffff"; // White
const textColorSecondary = "#333333"; // Dark Gray
const errorColor = "#B00020"; // Red 600
const surfaceColor = "#FFFFFF"; // White
const shadowColor = "#000";
const dividerColor = "#E0E0E0"; // Grey 300

export function PendingStoriesScreen() {
  const userData = useSelector((state) => state.counter.userState);

  const {
    data: allPendingStories,
    isFetching,
    refetch,
  } = useGetAllPendingStoriesQuery({
    userId: userData.userId,
  });

  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh functionality
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch(); // Fetch new data on refresh
    setRefreshing(false);
  };

  // If loading, show a loading spinner or any other UI element
  if (isFetching) {
    return (
      <Text style={[styles.loadingText, { color: primaryColor }]}>
        Loading...
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Stories</Text>
      <FlatList
        data={allPendingStories.allPendingStories} // Data from API call
        keyExtractor={(item) => item.id.toString()} // Unique key for each item
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.status}>{item.status}</Text>
            <Text style={styles.sideA}>{item.sideA}</Text>
            {/* You can add more information or interactions here */}
            <TouchableOpacity style={styles.button} onPress={() => {}}>
              <Text style={styles.buttonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroundColor,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: textColorPrimary,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: surfaceColor,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: primaryColor,
  },
  status: {
    fontSize: 14,
    color: secondaryColor,
    marginVertical: 8,
  },
  sideA: {
    fontSize: 14,
    color: textColorSecondary,
    marginBottom: 12,
  },
  button: {
    backgroundColor: secondaryColor,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: textColorPrimary,
    fontWeight: "bold",
  },
});
