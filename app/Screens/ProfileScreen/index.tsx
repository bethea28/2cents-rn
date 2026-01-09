import React, { useState } from "react"; // 🛡️ Added useState
import {
  Text,
  View,
  SafeAreaView,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import CreateStoryModal from '../../Modals/CreateStoryModal'

export const ProfileScreen = () => {
  const navigation = useNavigation();

  // 🛡️ State to control Modal visibility
  const [isModalVisible, setIsModalVisible] = useState(false);

  const user = useSelector((state: any) => state.auth.user || state.global.user);

  const serverUrl = "http://172.20.10.4:3000";
  const profileUri = user?.profilePic
    ? user?.profilePic
    : "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80";
  console.log('preetty girl in school', user)
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.storyCard}>
      <Image
        style={styles.storyImage}
        source={{ uri: "https://www.rollingstone.com/wp-content/uploads/2022/02/0001x.jpg" }}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 🥊 HEADER: Fighter Identity */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <Image
            style={styles.avatar}
            source={{ uri: profileUri }}
            onError={(e) => console.error("Avatar error:", e.nativeEvent.error)}
          />
        </View>

        <View style={styles.identity}>
          <Text style={styles.username}>{user?.userName?.toUpperCase() || "FIGHTER"}</Text>
          <Text style={styles.bio}>Entering the Arena... Ready for battle.</Text>
        </View>
      </View>

      {/* 📊 STATS Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>BATTLES</Text>
        </View>
        <View style={[styles.statBox, styles.statBorder]}>
          <Text style={styles.statNumber}>4.8k</Text>
          <Text style={styles.statLabel}>REP</Text>
        </View>

        {/* 🛡️ Updated Trigger: Sets modal state to true */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.createButtonText}>+ POST</Text>
        </TouchableOpacity>
      </View>

      {/* 🎞️ FEED: Highlight Reel */}
      <View style={styles.feedSection}>
        <Text style={styles.sectionTitle}>HIGHLIGHT REEL</Text>
        <FlatList
          style={styles.storyList}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={renderItem}
        />

        {/* 🛡️ Passing visibility and close function to your Modal component */}
        <CreateStoryModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
    marginTop: 10,
  },
  avatarWrapper: {
    borderWidth: 3,
    borderColor: "#a349a4", // The Signature Purple
    borderRadius: 60,
    padding: 3,
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  identity: { marginLeft: 20, flex: 1 },
  username: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1
  },
  bio: { color: "#666", fontSize: 13, marginTop: 5 },

  statsBar: {
    flexDirection: "row",
    backgroundColor: "#0A0A0A",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  statBox: { alignItems: "center", flex: 1 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#222" },
  statNumber: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  statLabel: { color: "#444", fontSize: 10, fontWeight: "900" },

  createButton: {
    backgroundColor: "#a349a4",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  createButtonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },

  feedSection: { marginTop: 30, paddingLeft: 20 },
  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 15
  },
  storyList: { overflow: "visible" },
  storyCard: { marginRight: 15 },
  storyImage: { width: 140, height: 200, borderRadius: 12, backgroundColor: "#111" },
});