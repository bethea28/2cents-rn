import React from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useGetAllPendingStoriesQuery } from "@/store/api/api";
import { useSelector } from "react-redux";
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayerPlayback } from '../../Components/VideoPlayerPlayback';

export const ChallengesScreen = ({ navigation }) => {
    const userState = useSelector((state) => state.counter.userState);
    const currentUserId = userState?.userId;

    const {
        data: stories,
        isLoading,
        refetch,
        isFetching
    } = useGetAllPendingStoriesQuery(currentUserId);

    // Initial load: Full screen spinner
    if (isLoading && !isFetching) {
        return (
            <View style={styles.loadingFull}>
                <ActivityIndicator size="large" color="#FF3B30" />
                <Text style={styles.loadingText}>ENTERING THE ARENA...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 🛡️ REFRESH MESSAGE: Only shows when the user pulls down */}
            {isFetching && (
                <View style={styles.refreshMessageContainer}>
                    <ActivityIndicator size="small" color="#FF3B30" style={{ marginRight: 10 }} />
                    <Text style={styles.refreshText}>SCOUTING FOR NEW BEEF...</Text>
                </View>
            )}

            <FlatList
                data={stories}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={refetch}
                        tintColor="#FF3B30"
                        colors={["#FF3B30"]}
                    />
                }
                renderItem={({ item }) => {
                    const isAwaitingAcceptance = item.status === 'pending-acceptance';
                    // const isTheChallenger = item.sideAAuthorId === currentUserId;
                    // Inside renderItem
                    const isTheChallenger = item.sideAAuthorId === currentUserId;
                    const statusLabel = item.status === 'pending-acceptance'
                        ? (isTheChallenger ? "WAITING FOR ACCEPTANCE" : "ACTION REQUIRED: ACCEPT?")
                        : (isTheChallenger ? "THEY ARE RECORDING..." : "ACTION REQUIRED: RECORD REBUTTAL");
                    return (
                        <TouchableOpacity
                            onPress={() => !isTheChallenger && navigation.navigate('ChallengeDetailsScreen', { story: item })}
                            disabled={isTheChallenger}
                            style={[
                                styles.card,
                                isTheChallenger && { opacity: 0.6 }
                            ]}
                        >
                            <View style={styles.videoContainer}>
                                <VideoPlayerPlayback
                                    videoSource={item.sideAVideoUrl}
                                    isMuted={true}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={styles.videoOverlay}>
                                    <Ionicons name="play" size={20} color="white" />
                                </View>
                            </View>

                            <View style={styles.textContent}>
                                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.username}>
                                    {isTheChallenger ? "Waiting for response..." : `From: @${item.sideAUsername || 'User'}`}
                                </Text>
                                <Text style={styles.wager}>Stake: {item.wager}</Text>

                                <View style={styles.statusRow}>
                                    <Ionicons
                                        name={isAwaitingAcceptance ? "time-outline" : "flame"}
                                        size={14}
                                        color={isTheChallenger ? "#666" : (isAwaitingAcceptance ? "#5856D6" : "#FFD700")}
                                    />
                                    <Text style={[
                                        styles.statusText,
                                        { color: isTheChallenger ? '#666' : (isAwaitingAcceptance ? '#5856D6' : '#FFD700') }
                                    ]}>
                                        {isTheChallenger ? " SENT (PENDING)" : (isAwaitingAcceptance ? " PENDING ACCEPTANCE" : " TIME TO RECORD")}
                                        {" • "}{item.expiresAt ? formatDistanceToNow(new Date(item.expiresAt)) : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            {!isTheChallenger && <Ionicons name="chevron-forward" size={20} color="#444" />}
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="shield-checkmark-outline" size={50} color="#333" />
                        <Text style={styles.emptyText}>No active challenges. You're safe... for now.</Text>
                        <TouchableOpacity onPress={refetch} style={styles.refreshButton}>
                            <Text style={styles.refreshButtonText}>CHECK AGAIN</Text>
                        </TouchableOpacity>
                    </View>
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
        alignItems: 'center',
    },
    loadingText: {
        color: '#FF3B30',
        marginTop: 15,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    refreshMessageContainer: {
        flexDirection: 'row',
        backgroundColor: '#111',
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#FF3B30',
    },
    refreshText: {
        color: '#FF3B30',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
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
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    textContent: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
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
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 40,
    },
    refreshButton: {
        marginTop: 30,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderWidth: 1,
        borderColor: '#FF3B30',
        borderRadius: 25,
    },
    refreshButtonText: {
        color: '#FF3B30',
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});