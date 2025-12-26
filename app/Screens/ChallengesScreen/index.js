// app/Screens/ChallengesInbox/index.tsx
import React from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useGetAllPendingStoriesQuery } from "@/store/api/api";
// import { useAuth } from '../../hooks/useAuth'; // Assuming you have an auth hook for the ID
import { useSelector } from "react-redux";

export const ChallengesScreen = ({ navigation }) => {
    // const { user } = useAuth();
    const userAuth = useSelector((state) => state.auth.user);
    const userState = useSelector((state) => state.counter.userState); // Assuming your slice is named 'userSlice'

    console.log('test me now', userState.userId)
    // 1. Fetch data on mount
    const { data: stories, isLoading, error } = useGetAllPendingStoriesQuery(userState?.userId);
    console.log('all stories rza', error, stories)
    if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

    if (error) return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'red' }}>Error loading challenges.</Text>
        </View>
    );
    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <FlatList
                data={stories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#333' }}
                        onPress={() => navigation.navigate('ChallengeDetailsScreen', { story: item })}
                    >
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{item.title}</Text>
                        <Text style={{ color: '#FF3B30' }}>From: @{item.SideA?.username}</Text>
                        <Text style={{ color: '#aaa' }}>Stake: {item.wager}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 50 }}>No active challenges. You're safe... for now.</Text>
                }
            />
        </View>
    );
};