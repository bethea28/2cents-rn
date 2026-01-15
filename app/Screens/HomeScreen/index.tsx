import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Pressable } from 'react-native';
import CreateStoryModal from '../../Modals/CreateStoryModal'
import { useSelector } from "react-redux";
import { StoriesFeed } from '../../Components/StoriesFeed'
import { useSendTestPushMutation } from "@/store/api/api";
import Toast from 'react-native-toast-message'


export function HomeScreen() {
  const userData = useSelector((state) => state.auth);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [feed] = useState([])
  const [triggerTestPush, { isLoading }] = useSendTestPushMutation();
  console.log('USER NAME NOW', feed)

  const handleTestBeef = async () => {
    // 🔍 Extract ID based on your Redux structure
    const userId = userData?.user?.user?.id

    console.log('🛡️ Attempting Test Push for User ID method:', userId);

    if (!userId) {
      alert("Fighter ID not found in state! Check Redux.");
      return;
    }

    try {
      // 🥩 This hits your pushController.sendTestPush on the backend
      await triggerTestPush({ userId: userId }).unwrap();
      console.log("🚀 Test Trigger Sent Successfully!");
    } catch (err) {
      console.error("❌ Failed to trigger beef:", err);
      alert("Push failed. Is ngrok running?");
    }
  };
  const handleToast = () => {
    Toast.show({
      type: 'success',
      text1: 'This is an info message'
    });
  }
  console.log('user data GZA', userData)
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
      <Text style={styles.headerTitle}>{userData.user.user.username}</Text>
      <Text style={styles.headerTitle}>{userData.user.user.email}</Text>

      {/* Main Feed Area */}
      <StoriesFeed />
      {feed.length > 0 && <View style={styles.feedPlaceholder}>
        <Text style={styles.placeholderText}>Your 2cents Feed will appear here.</Text>
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={{ color: '#8a2be2', fontWeight: 'bold' }}>Start a Conflict +</Text>
        </TouchableOpacity>
      </View>}
      <Pressable
        onPress={handleTestBeef}
        disabled={isLoading}
        style={{
          backgroundColor: '#a349a4',
          padding: 20,
          borderRadius: 10,
          opacity: isLoading ? 0.5 : 1
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {isLoading ? "SENDING..." : "🥩 TEST MY BEEF"}
        </Text>
      </Pressable>
      <Pressable
        onPress={handleToast}
        disabled={isLoading}
        style={{
          backgroundColor: '#a349a4',
          padding: 20,
          borderRadius: 10,
          opacity: isLoading ? 0.5 : 1
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {isLoading ? "SENDING..." : "🥩 TEST MY TOAST"}
        </Text>
      </Pressable>

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
