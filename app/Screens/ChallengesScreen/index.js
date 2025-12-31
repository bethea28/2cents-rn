import React from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useGetAllPendingStoriesQuery } from "@/store/api/api";
import { useSelector } from "react-redux";
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayerPlayback } from '../../Components/VideoPlayerPlayback';

export const ChallengesScreen = ({ navigation }) => {
    const userState = useSelector((state) => state.counter.userState);
    const { data: stories, isLoading } = useGetAllPendingStoriesQuery(userState?.userId);

    if (isLoading) return <ActivityIndicator style={styles.loadingFull} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={stories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const isAwaitingAcceptance = item.status === 'pending-acceptance';

                    return (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ChallengeDetailsScreen', { story: item })}
                            style={styles.card}
                        >
                            {/* VIDEO TEASER CONTAINER */}
                            <View style={styles.videoContainer}>
                                <VideoPlayerPlayback
                                    videoSource={item.sideAVideoUrl}
                                    isMuted={true}
                                    style={StyleSheet.absoluteFill}
                                />

                                {/* 🎨 UX: The Play Icon Overlay */}
                                <View style={styles.videoOverlay}>
                                    <Ionicons name="play" size={20} color="white" style={styles.playIcon} />
                                </View>
                            </View>

                            {/* TEXT CONTENT */}
                            <View style={styles.textContent}>
                                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.username}>From: @{item.SideA?.username}</Text>
                                <Text style={styles.wager}>Stake: {item.wager}</Text>

                                {/* The Status/Timer Row */}
                                <View style={styles.statusRow}>
                                    <Ionicons
                                        name={isAwaitingAcceptance ? "time-outline" : "flame"}
                                        size={14}
                                        color={isAwaitingAcceptance ? "#5856D6" : "#FFD700"}
                                    />
                                    <Text style={[
                                        styles.statusText,
                                        { color: isAwaitingAcceptance ? '#5856D6' : '#FFD700' }
                                    ]}>
                                        {isAwaitingAcceptance ? " PENDING ACCEPTANCE" : " TIME TO RECORD"}
                                        {" • "}{item.expiresAt ? formatDistanceToNow(new Date(item.expiresAt)) : 'N/A'}
                                    </Text>
                                </View>
                            </View>

                            {/* 🎨 UX: The "Discovery" Chevron */}
                            <Ionicons name="chevron-forward" size={20} color="#444" />
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No active challenges. You're safe... for now.</Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingFull: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    videoContainer: {
        width: 80,
        height: 110,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 15,
        backgroundColor: '#111',
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    playIcon: {
        opacity: 0.8,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    textContent: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    username: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: '500',
    },
    wager: {
        color: '#aaa',
        fontSize: 14,
        marginTop: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    emptyText: {
        color: '#aaa',
        textAlign: 'center',
        marginTop: 50,
        paddingHorizontal: 40,
        lineHeight: 20,
    },
});