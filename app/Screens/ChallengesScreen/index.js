import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { FlashList } from "@shopify/flash-list";
import { useSelector } from "react-redux";
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from "@react-navigation/native";
import { useVideoPlayer, VideoView } from 'expo-video'; // 🛡️ Import directly
import * as Haptics from 'expo-haptics';

import { useGetAllPendingStoriesQuery } from "@/store/api/api";
import { useVideoValet } from "../../Components/VideoProvider";

// 🛡️ SUB-COMPONENT: This prevents the whole list from re-rendering
const ChallengeVideoThumbnail = ({ url, isActive }) => {
    const player = useVideoPlayer(url, (p) => {
        p.loop = true;
        p.muted = true;
        if (isActive) p.play();
    });

    useEffect(() => {
        if (isActive) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, player]);

    return (
        <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeViewType="textureView" // 🛡️ S8 Stability
            allowsFullscreen={false}
            showsPlaybackControls={false}
        />
    );
};

export const ChallengesScreen = ({ navigation }) => {
    const isFocused = useIsFocused();
    const userState = useSelector((state) => state.auth.user.user);
    const currentUserId = userState?.id;

    const { setActivePlayerId } = useVideoValet();
    const [activeId, setActiveId] = useState(null);

    const { data: stories, isLoading, refetch, isFetching } = useGetAllPendingStoriesQuery(currentUserId);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const id = viewableItems[0].item.id.toString();
            setActiveId(id);
            setActivePlayerId(id); // Tell the provider who is active
        }
    }).current;

    if (isLoading && !isFetching) {
        return (
            <View style={styles.loadingFull}>
                <ActivityIndicator size="large" color="#a349a4" />
                <Text style={styles.loadingText}>SCOUTING THE ARENA...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlashList
                data={stories}
                keyExtractor={(item) => item.id.toString()}
                estimatedItemSize={140}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#a349a4" />
                }
                renderItem={({ item }) => {
                    const isTheChallenger = item.sideAAuthorId === currentUserId;
                    const isNew = !isTheChallenger && !item.sideBViewedAt;
                    const itemId = item.id.toString();

                    // 🛡️ Only play if this item is in view AND the screen is focused
                    const isActive = isFocused && activeId === itemId;

                    return (
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                navigation.navigate('ChallengeDetailsScreen', { story: item });
                            }}
                            style={[styles.card, isNew && styles.newCard]}
                        >
                            <View style={styles.videoContainer}>
                                {/* 🛡️ Instead of getPlayer (which is null), we use our Sub-Component */}
                                <ChallengeVideoThumbnail
                                    url={item.sideAVideoUrl}
                                    isActive={isActive}
                                />

                                {isNew && <View style={styles.newBadge} />}
                                <View style={styles.videoOverlay}>
                                    <Ionicons name="play-circle" size={24} color="rgba(255,255,255,0.6)" />
                                </View>
                            </View>

                            <View style={styles.textContent}>
                                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.username}>
                                    {isTheChallenger ? `To: @${item.sideBUsername || 'Opponent'}` : `From: @${item.sideAUsername}`}
                                </Text>
                                <View style={styles.stakeBadge}>
                                    <Text style={styles.stakeText}>STAKE: {item.wager?.toUpperCase()}</Text>
                                </View>
                                <View style={styles.statusRow}>
                                    <Ionicons name="time-outline" size={14} color="#666" />
                                    <Text style={styles.statusText}>
                                        {isTheChallenger ? " SENT" : " ACTION REQUIRED"}
                                        {" • "}{item.expiresAt ? formatDistanceToNow(new Date(item.expiresAt), { addSuffix: true }) : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            {!isTheChallenger && <Ionicons name="chevron-forward" size={20} color="#333" />}
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
};
// ... styles remain the same

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingFull: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#a349a4', marginTop: 15, fontWeight: 'bold', letterSpacing: 2 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#111' },
    newCard: { backgroundColor: '#080808' },
    videoContainer: { width: 70, height: 100, borderRadius: 10, overflow: 'hidden', marginRight: 15, backgroundColor: '#111' },
    videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
    newBadge: { position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#a349a4', zIndex: 10, borderWidth: 1, borderColor: '#000' },
    textContent: { flex: 1 },
    title: { color: '#fff', fontSize: 17, fontWeight: '900' },
    username: { color: '#a349a4', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
    stakeBadge: { alignSelf: 'flex-start', backgroundColor: '#111', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 5, borderWidth: 1, borderColor: '#222' },
    stakeText: { color: '#FFD700', fontSize: 10, fontWeight: '900' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    statusText: { fontSize: 10, fontWeight: '800', color: '#666' }
});