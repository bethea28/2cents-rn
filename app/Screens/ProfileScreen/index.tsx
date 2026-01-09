import React, { useState } from "react";
import {
  Text,
  View,
  SafeAreaView,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Video } from 'expo-av';
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import CreateStoryModal from '../../Modals/CreateStoryModal';
import { useGetAllCompleteStoriesQuery } from "@/store/api/api";

// 🛡️ SUB-COMPONENT: Individual card logic to prevent whole-list re-renders
const VideoCard = ({ item, navigation }: { item: any, navigation: any }) => {
  const [status, setStatus] = useState<any>({});

  return (
    <TouchableOpacity
      style={styles.storyCard}
      onPress={() => {
        navigation.navigate('FullStoryScreen', {
          storyId: item.id,
          initialData: item
        });
      }}
    >
      <Video
        source={{ uri: item.sideAVideoUrl }}
        style={styles.storyImage}
        resizeMode="cover"
        isLooping
        shouldPlay={true}
        isMuted={true}
        onPlaybackStatusUpdate={s => setStatus(() => s)}
      />

      {!status.isLoaded && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator color="#fff" />
        </View>
      )}

      <View style={styles.storyInfo}>
        <Text style={styles.storyTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.wagerText}>{item.wager}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const user = useSelector((state: any) => state.counter.userState);
  const currentUserId = user?.userId;

  const { data: stories, isLoading } = useGetAllCompleteStoriesQuery(currentUserId);

  const renderStoryItem = ({ item }: { item: any }) => (
    <VideoCard item={item} navigation={navigation} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <Image style={styles.avatar} source={{ uri: user?.profilePic || "https://via.placeholder.com/150" }} />
        </View>
        <View style={styles.identity}>
          <Text style={styles.username}>{user?.userName?.toUpperCase() || "FIGHTER"}</Text>
          <Text style={styles.bio}>Arena Veteran • {stories?.length || 0} Battles</Text>
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stories?.length || 0}</Text>
          <Text style={styles.statLabel}>BATTLES</Text>
        </View>
        <View style={[styles.statBox, styles.statBorder]}>
          <Text style={styles.statNumber}>{user?.reputation || 0}</Text>
          <Text style={styles.statLabel}>REP</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.createButtonText}>+ POST</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.feedSection}>
        <Text style={styles.sectionTitle}>HIGHLIGHT REEL</Text>
        {isLoading ? (
          <ActivityIndicator color="#a349a4" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={stories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderStoryItem}
            ListEmptyComponent={<Text style={styles.emptyText}>No battles recorded.</Text>}
          />
        )}
      </View>
      <CreateStoryModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { flexDirection: "row", padding: 20, alignItems: "center" },
  avatarWrapper: { borderWidth: 3, borderColor: "#a349a4", borderRadius: 60, padding: 3 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  identity: { marginLeft: 15 },
  username: { color: "#fff", fontSize: 22, fontWeight: "900" },
  bio: { color: "#666", fontSize: 12 },
  statsBar: { flexDirection: "row", backgroundColor: "#0A0A0A", marginHorizontal: 20, borderRadius: 15, padding: 15, alignItems: "center" },
  statBox: { alignItems: "center", flex: 1 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#222" },
  statNumber: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  statLabel: { color: "#444", fontSize: 10, fontWeight: "900" },
  createButton: { backgroundColor: "#a349a4", paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  createButtonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  feedSection: { marginTop: 25, paddingLeft: 20 },
  sectionTitle: { color: "#fff", fontSize: 14, fontWeight: "900", marginBottom: 15 },
  storyCard: { marginRight: 15, width: 150, height: 220, borderRadius: 12, backgroundColor: "#111", overflow: "hidden" },
  storyImage: { width: '100%', height: '100%' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  storyInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.6)' },
  storyTitle: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  wagerText: { color: '#4CD964', fontSize: 10, fontWeight: '800' },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 20, paddingRight: 20 }
});