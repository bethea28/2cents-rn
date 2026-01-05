import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, Dimensions, Pressable,
    Animated, SafeAreaView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { CommentItem } from '../../Components/CommentItem';
// 🛠 REDUX LAYER
import { useCastVoteMutation, usePostCommentMutation, useGetCommentsQuery } from "@/store/api/api";

const { height, width } = Dimensions.get('window');

export const FullStoryScreen = ({ route, navigation }) => {
    const { story } = route.params;

    // --- REDUX MUTATION ---
    const [castVote, { isLoading: isVoting }] = useCastVoteMutation();
    const [postComment, { isLoading: isPosting }] = usePostCommentMutation();
    // 1. Add this hook with your other mutations
    const {
        data: commentsData,
        isLoading: isCommentsLoading,
        isFetching: isCommentsFetching
    } = useGetCommentsQuery({ storyId: story.id });

    // 2. Extract the actual array from your backend response structure
    // Your backend returns { success: true, data: [...] }
    const commentsList = commentsData?.data || [];
    const [commentText, setCommentText] = useState('');
    // --- UI STATE ---
    const [mutedSide, setMutedSide] = useState('B');
    const [userSide, setUserSide] = useState(story.userSide || null);
    const [voteMessage, setVoteMessage] = useState(null);
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['1%', '60%', '95%'], []);

    const openComments = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        bottomSheetRef.current?.snapToIndex(1);
    };

    // --- ANIMATION LOGIC ---
    const initialPercent = useMemo(() => {
        const total = (story.challengerVotes || 0) + (story.rebuttalVotes || 0);
        return total > 0 ? (story.challengerVotes / total) * 100 : 50;
    }, [story.id]);

    const meterAnim = useRef(new Animated.Value(initialPercent)).current;
    const toastAnim = useRef(new Animated.Value(0)).current;

    // --- AUDIO SETUP ---
    useEffect(() => {
        const setupAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    allowsRecordingIOS: false,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });
            } catch (e) {
                console.log("Audio Mode Error:", e);
            }
        };
        setupAudio();
    }, []);

    // --- METER SYNC ---
    useEffect(() => {
        const trueTotal = (story.challengerVotes || 0) + (story.rebuttalVotes || 0);
        const truePercent = trueTotal > 0 ? (story.challengerVotes / trueTotal) * 100 : 50;

        Animated.timing(meterAnim, {
            toValue: truePercent,
            duration: 600,
            useNativeDriver: false,
        }).start();
    }, [story.challengerVotes, story.rebuttalVotes]);

    const handleSend = async () => {
        if (!commentText.trim() || isPosting) return;
        console.log('bryan beth', userSide)
        // return
        try {
            await postComment({
                storyId: story.id,
                content: commentText.trim(),
                // 🛠 If userSide is null (hasn't voted), send "Neutral"
                // This matches your backend ENUM exactly.
                side: userSide ? userSide : 'Neutral'
            }).unwrap();

            setCommentText('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error("Post Error:", error);
        }
    }
    // --- TOAST ANIMATION ---
    const showToast = (msg) => {
        setVoteMessage(msg);
        Animated.sequence([
            Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.delay(2000),
            Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setVoteMessage(null));
    };

    // --- VOTE HANDLER ---
    const handleVote = async (side) => {
        if (isVoting) return;
        if (userSide === side) {
            Haptics.selectionAsync();
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const currentVal = meterAnim._value;
            Animated.spring(meterAnim, {
                toValue: side === 'A' ? currentVal + 5 : currentVal - 5,
                friction: 4,
                useNativeDriver: false,
            }).start();

            await castVote({ storyId: story.id, side: side }).unwrap();
            setUserSide(side);
            showToast(`REPPING TEAM ${side === 'A' ? 'CHALLENGER' : 'REBUTTAL'}`);
        } catch (error) {
            console.error("Vote Error:", error);
            setUserSide(story.userSide || null);
            Alert.alert("Arena Error", error.data?.error || "Could not cast vote.");
        }
    };

    const toggleAudio = (side) => {
        setMutedSide(side === 'A' ? 'B' : 'A');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const vsPosition = meterAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [-20, width - 20]
    });
    console.log('u god, ', commentsData)
    return (
        <View style={styles.container}>
            {/* TOAST MESSAGE */}
            {voteMessage && (
                <Animated.View style={[styles.toastContainer, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Text style={styles.toastText}>{voteMessage}</Text>
                </Animated.View>
            )}

            <SafeAreaView style={styles.headerOverlay}>
                <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color="white" />
                </Pressable>
            </SafeAreaView>

            <View style={styles.arenaContainer}>
                {/* TOP: CHALLENGER */}
                <Pressable style={styles.videoSegment} onPress={() => toggleAudio('A')}>
                    <Video
                        source={{ uri: story.sideAVideoUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={true}
                        isLooping
                        isMuted={mutedSide === 'A'}
                    />
                    <View style={[styles.sideBadge, mutedSide === 'B' && styles.activeBadge]}>
                        <Ionicons name={mutedSide === 'B' ? "volume-high" : "volume-mute"} size={12} color="white" />
                        <Text style={styles.badgeText}>CHALLENGER</Text>
                    </View>
                </Pressable>

                {/* THE LIVE SHOCK METER */}
                <View style={styles.meterContainer}>
                    <Animated.View style={[styles.meterFillA, {
                        width: meterAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                        })
                    }]} />
                    <Animated.View style={[styles.vsFloatingBadge, { left: vsPosition }]}>
                        <Text style={styles.vsText}>VS</Text>
                    </Animated.View>
                </View>

                {/* BOTTOM: REBUTTAL */}
                <Pressable style={styles.videoSegment} onPress={() => toggleAudio('B')}>
                    <Video
                        source={{ uri: story.sideBVideoUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={true}
                        isLooping
                        isMuted={mutedSide === 'B'}
                    />
                    <View style={[styles.sideBadgeBottom, mutedSide === 'A' && styles.activeBadge]}>
                        <Text style={styles.badgeText}>REBUTTAL</Text>
                        <Ionicons name={mutedSide === 'A' ? "volume-high" : "volume-mute"} size={12} color="white" />
                    </View>
                </Pressable>
            </View>

            <View style={styles.interactionLayer}>
                <View style={styles.titleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.storyTitle} numberOfLines={1}>{story.title}</Text>
                        <Text style={styles.wagerLabel}>WAGER: <Text style={styles.wagerText}>{story.wager}</Text></Text>
                    </View>
                </View>

                <View style={styles.voteRow}>
                    <Pressable
                        style={[styles.voteButton, styles.challengerBtn, userSide === 'B' && styles.inactiveSide, userSide === 'A' && styles.selectedSide]}
                        onPress={() => handleVote('A')}
                    >
                        {isVoting && userSide === null ? <ActivityIndicator color="#fff" /> :
                            <Text style={styles.voteButtonText}>{userSide === 'A' ? '✓ YOUR TEAM' : 'TEAM CHALLENGER'}</Text>}
                    </Pressable>

                    <Pressable
                        style={[styles.voteButton, styles.rebuttalBtn, userSide === 'A' && styles.inactiveSide, userSide === 'B' && styles.selectedSide]}
                        onPress={() => handleVote('B')}
                    >
                        {isVoting && userSide === null ? <ActivityIndicator color="#fff" /> :
                            <Text style={styles.voteButtonText}>{userSide === 'B' ? '✓ YOUR TEAM' : 'TEAM REBUTTAL'}</Text>}
                    </Pressable>
                </View>

                <Pressable style={styles.commentPreview} onPress={openComments}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#666" />
                    <Text style={styles.commentPlaceholder}>Swipe up to join the trash talk...</Text>
                </Pressable>
            </View>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: '#0A0A0A' }}
                handleIndicatorStyle={{ backgroundColor: '#333' }}
                style={{ zIndex: 999 }}
                containerStyle={{ zIndex: 999 }}
            >
                <View style={{ flex: 1 }}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.commentHeaderTitle}>TRASH TALK</Text>
                    </View>

                    <BottomSheetFlatList
                        data={commentsList} // 👈 Use the live list from Redux
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <CommentItem
                                comment={item}
                                isReply={false}
                            />
                        )}
                        contentContainerStyle={{ paddingBottom: 60 }} // Extra space for the input
                        ListEmptyComponent={
                            isCommentsLoading ? (
                                <ActivityIndicator style={{ marginTop: 20 }} color="#a349a4" />
                            ) : (
                                <Text style={styles.emptyText}>No heat yet. Start the fire.</Text>
                            )
                        }
                        // Optional: Show a small spinner at the top when auto-refreshing
                        refreshing={isCommentsFetching}
                        onRefresh={() => { }}
                    />

                    {/* 🛠 FIXED INPUT SECTION */}
                    <View style={styles.inputContainer}>
                        <BottomSheetTextInput
                            style={styles.input}
                            placeholder="Talk your shit..."
                            placeholderTextColor="#666"
                            value={commentText}            // Connected to State
                            onChangeText={setCommentText}  // Updates State
                            onSubmitEditing={handleSend}   // Allows "Enter" to send
                        />
                        <Pressable
                            style={styles.sendBtn}
                            onPress={handleSend}           // Triggers handleSend
                            disabled={!commentText.trim() || isPosting} // Prevents spam
                        >
                            {isPosting ? (
                                <ActivityIndicator size="small" color="#a349a4" />
                            ) : (
                                <Ionicons
                                    name="send"
                                    size={20}
                                    color={commentText.trim() ? "#a349a4" : "#444"}
                                />
                            )}
                        </Pressable>
                    </View>
                </View>
            </BottomSheet>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    toastContainer: {
        position: 'absolute', top: height * 0.45, alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 25, zIndex: 10000, elevation: 10
    },
    toastText: { color: '#000', fontWeight: '900', fontSize: 14 },
    headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    closeButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', marginLeft: 20, marginTop: Platform.OS === 'android' ? 40 : 10
    },
    arenaContainer: { height: height * 0.72, zIndex: 1 },
    videoSegment: { flex: 1, backgroundColor: '#050505', overflow: 'hidden' },
    sideBadge: {
        position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20
    },
    sideBadgeBottom: {
        position: 'absolute', bottom: 20, left: 20, flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20
    },
    activeBadge: { backgroundColor: '#a349a4', borderWidth: 1, borderColor: 'white' },
    badgeText: { color: 'white', fontSize: 10, fontWeight: '900', marginHorizontal: 5 },
    meterContainer: { height: 18, width: '100%', backgroundColor: '#00D1FF', flexDirection: 'row', alignItems: 'center', zIndex: 1, elevation: 0 },
    meterFillA: { height: '100%', backgroundColor: '#a349a4', borderRightWidth: 2, borderColor: '#fff' },
    vsFloatingBadge: {
        position: 'absolute', top: -11, width: 40, height: 40,
        borderRadius: 20, backgroundColor: '#000', borderWidth: 3, borderColor: '#fff',
        justifyContent: 'center', alignItems: 'center', zIndex: 2, elevation: 0
    },
    vsText: { color: '#fff', fontWeight: '900', fontSize: 12 },
    interactionLayer: {
        flex: 1, padding: 20, backgroundColor: '#0A0A0A', borderTopLeftRadius: 30, borderTopRightRadius: 30,
        marginTop: -20, zIndex: 5,
    },
    storyTitle: { color: 'white', fontSize: 22, fontWeight: '900' },
    wagerLabel: { color: '#666', fontSize: 12, fontWeight: '600', marginTop: 4 },
    wagerText: { color: '#FFD700', fontWeight: '900' },
    voteRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    voteButton: { flex: 0.48, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    challengerBtn: { backgroundColor: '#a349a4' },
    rebuttalBtn: { backgroundColor: '#00D1FF' },
    inactiveSide: { opacity: 0.3 },
    selectedSide: { borderWidth: 2, borderColor: '#fff' },
    voteButtonText: { color: '#fff', fontWeight: '900', fontSize: 11 },
    commentPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', padding: 15, borderRadius: 12 },
    commentPlaceholder: { color: '#666', fontSize: 14, marginLeft: 10, fontStyle: 'italic' },
    commentHeader: { padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222' },
    commentHeaderTitle: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 2 },
    inputContainer: { padding: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', borderTopWidth: 1, borderTopColor: '#222' },
    input: { flex: 1, backgroundColor: '#1A1A1A', color: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, fontSize: 14 },
    sendBtn: { marginLeft: 15 },
    emptyText: { color: '#444', textAlign: 'center', marginTop: 40, fontStyle: 'italic' }
});