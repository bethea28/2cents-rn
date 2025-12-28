import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import CreateStoryModal from '../../Modals/CreateStoryModal'
import { useSelector } from "react-redux";
export function HomeScreen() {
  const userData = useSelector((state) => state.counter.userState);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [feed] = useState([])
  console.log('USER NAME NOW', userData)
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with the Purple Create Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.buttonText}>Call Out</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.headerTitle}>{userData.userName}</Text>
      <Text style={styles.headerTitle}>{userData.email}</Text>

      {/* Main Feed Area */}
      {feed.length > 0 && <View style={styles.feedPlaceholder}>
        <Text style={styles.placeholderText}>Your 2cents Feed will appear here.</Text>
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={{ color: '#8a2be2', fontWeight: 'bold' }}>Start a Conflict +</Text>
        </TouchableOpacity>
      </View>}

      {/* The Modal Layer */}
      <CreateStoryModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#8a2be2', // That purple from your screenshot
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  feedPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 10,
  },
  emptyStateButton: {
    padding: 10,
  }
});
// import {
//   View,
//   FlatList,
//   Pressable,
//   Text,
//   RefreshControl,
//   StyleSheet,
//   ActivityIndicator,
// } from "react-native";
// import React, { useState } from "react";
// import { useNavigation } from "@react-navigation/native";
// import { useGetAllStoriesQuery } from "@/store/api/api";
// import { useAsyncStorage } from "@/app/customHooks";
// import { useSelector } from "react-redux";
// import { Searchbar } from "react-native-paper";
// import { StoryCard } from "@/app/Components/StoryCard";
// // Define a Material Design inspired color palette
// const primaryColor = "#a349a4"; // Purple 500 (approx.)
// const primaryLightColor = "#d67bff"; // Purple 200 (approx.)
// const primaryDarkColor = "#751976"; // Purple 700 (approx.)
// const secondaryColor = "#f28e1c"; // Orange A200 (approx.)
// const secondaryLightColor = "#ffc04f"; // Orange A100 (approx.)
// const secondaryDarkColor = "#b95f00"; // Orange A400 (approx.)
// const backgroundColor = "#f7b767"; // Light Orange 200 (approx.)
// const textColorPrimary = "#ffffff"; // White
// const textColorSecondary = "#333333"; // Dark Gray
// const errorColor = "#B00020"; // Red 600
// const surfaceColor = "#FFFFFF"; // White (for cards, buttons)
// const shadowColor = "#000";
// const dividerColor = "#E0E0E0"; // Grey 300

// export function HomeScreen() {
//   const [refreshing, setRefreshing] = useState(false);
//   const navigation = useNavigation();
//   const {
//     data: allStories,
//     isLoading,
//     isError,
//     error,
//     refetch,
//   } = useGetAllStoriesQuery();
//   const [getData] = useAsyncStorage();
//   const userData = useSelector((state) => state.counter.userState);
//   const userName = userData?.data?.user?.name || "Guest"; // Handle potential undefined user
//   const [searchQuery, setSearchQuery] = React.useState("");

//   const handleRefresh = async () => {
//     setRefreshing(true);
//     try {
//       await refetch();
//     } catch (err) {
//       console.error("Error refreshing data:", err);
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const renderItem = ({ item }) => {
//     console.log("this item now", item);
//     // return;
//     return (
//       <View style={styles.cardWrapper}>
//         <StoryCard item={item} style={styles.companyCard} />
//       </View>
//     );
//   };

//   if (isLoading) {
//     return (
//       <View
//         style={[styles.loadingContainer, { backgroundColor: backgroundColor }]}
//       >
//         <ActivityIndicator size="large" color={primaryColor} />
//         <Text style={[styles.loadingText, { color: textColorSecondary }]}>
//           Loading Companies...
//         </Text>
//       </View>
//     );
//   }

//   if (isError) {
//     return (
//       <View
//         style={[styles.errorContainer, { backgroundColor: backgroundColor }]}
//       >
//         <Text style={[styles.errorText, { color: errorColor }]}>
//           Error loading stories.
//         </Text>
//       </View>
//     );
//   }
//   console.log("GET ALL STORIES home", allStories.allStories);
//   return (

//     <View style={[styles.container, { backgroundColor: secondaryColor }]}>
//       {/* // Inside your Home or Main Navigator
//       const [isCreateVisible, setCreateVisible] = useState(false);

//       // This button goes in your header or as a Floating Action Button */}
//       <TouchableOpacity onPress={() => setCreateVisible(true)}>
//         <View style={styles.plusButton}>
//           <Text style={{ color: 'white', fontSize: 30 }}>+</Text>
//         </View>
//       </TouchableOpacity>

//       <Modal
//         animationType="slide"
//         visible={isCreateVisible}
//         onRequestClose={() => setCreateVisible(false)}
//       >
//         <CreateStoryFlow onClose={() => setCreateVisible(false)} />
//       </Modal>
//       {/* <View style={styles.header}>
//         <Text style={styles.greeting}>Hi {userName}!</Text>
//         <Text style={styles.title}>Welcome To TriniViews!</Text>
//         <Text style={styles.title}>
//           Let Us Help You Find Your Next Carnival Costume!
//         </Text>
//       </View>
//       <Searchbar
//         style={{ marginBottom: 10 }}
//         placeholder="Business Search"
//         onChangeText={setSearchQuery}
//         value={searchQuery}
//       />
//       {/* <View style={styles.buttonContainer}>
//         <Pressable
//           onPress={() => navigation.navigate("AddCompany")}
//           style={({ pressed }) => [
//             styles.button,
//             { backgroundColor: pressed ? primaryLightColor : primaryColor },
//           ]}
//           android_ripple={{ color: primaryDarkColor }}
//         >
//           <Text style={[styles.buttonText, { color: textColorPrimary }]}>
//             Add Company
//           </Text>
//         </Pressable>
//       </View> */}
//       <FlatList
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             tintColor={primaryColor}
//           />
//         }
//         data={allStories?.allStories}
//         renderItem={renderItem}
//         keyExtractor={(item) =>
//           item?.companyInfo?.id?.toString() || Math.random().toString()
//         }
//         contentContainerStyle={styles.listContentContainer}
//         ItemSeparatorComponent={() => <View style={styles.divider} />}
//       /> */}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     padding: 16,
//     backgroundColor: secondaryColor,
//     elevation: 8, // Subtle shadow for the header
//     marginBottom: 8,
//   },
//   greeting: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: textColorPrimary,
//     marginBottom: 4,
//   },
//   title: {
//     fontSize: 16,
//     color: textColorSecondary,
//   },
//   buttonContainer: {
//     paddingHorizontal: 16,
//     marginBottom: 16,
//     alignItems: "flex-end", // Align button to the right
//   },
//   button: {
//     backgroundColor: primaryColor,
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     borderRadius: 4, // Slightly rounded corners for Material Design
//     elevation: 2, // Subtle shadow for the button
//   },
//   buttonText: {
//     textAlign: "center",
//     fontSize: 16,
//     fontWeight: "bold",
//     color: textColorPrimary,
//   },
//   listContentContainer: {
//     paddingHorizontal: 16,
//     paddingBottom: 20,
//   },
//   cardWrapper: {
//     marginBottom: 16,
//   },
//   companyCard: {
//     backgroundColor: surfaceColor,
//     borderRadius: 4,
//     elevation: 1, // Subtle shadow for the card
//     overflow: "hidden", // Clip content within rounded borders
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: backgroundColor,
//   },
//   loadingText: {
//     fontSize: 16,
//     marginTop: 8,
//     color: textColorSecondary,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: backgroundColor,
//     padding: 16,
//   },
//   errorText: {
//     fontSize: 16,
//     textAlign: "center",
//   },
//   divider: {
//     height: 1,
//     backgroundColor: dividerColor,
//     marginVertical: 8,
//   },
// });
