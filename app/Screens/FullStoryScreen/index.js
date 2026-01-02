import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, Dimensions, Pressable,
    Animated, SafeAreaView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// 🛠 REDUX LAYER
import { useCastVoteMutation } from "@/store/api/api";

const { height, width } = Dimensions.get('window');

export const FullStoryScreen = ({ route, navigation }) => {
    const { story } = route.params;

    // --- REDUX MUTATION ---
    const [castVote, { isLoading: isVoting }] = useCastVoteMutation();

    // --- UI STATE ---
    const [mutedSide, setMutedSide] = useState('B');
    const [userSide, setUserSide] = useState(story.userSide || null);
    const [voteMessage, setVoteMessage] = useState(null);

    // --- ANIMATION LOGIC ---
    // UseMemo ensures initialPercent doesn't jitter on re-renders
    const initialPercent = useMemo(() => {
        const total = (story.challengerVotes || 0) + (story.rebuttalVotes || 0);
        return total > 0 ? (story.challengerVotes / total) * 100 : 50;
    }, [story.id]); // Only recalculate if the story itself changes

    const meterAnim = useRef(new Animated.Value(initialPercent)).current;
    const toastAnim = useRef(new Animated.Value(0)).current;

    // --- EFFECT 1: AUDIO SETUP ---
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

    // --- EFFECT 2: METER SYNC (THE TRUTH MONITOR) ---
    useEffect(() => {
        const trueTotal = (story.challengerVotes || 0) + (story.rebuttalVotes || 0);
        const truePercent = trueTotal > 0 ? (story.challengerVotes / trueTotal) * 100 : 50;

        Animated.timing(meterAnim, {
            toValue: truePercent,
            duration: 600, // Smooth slide to the backend truth
            useNativeDriver: false,
        }).start();
    }, [story.challengerVotes, story.rebuttalVotes]);

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
            // Optimistic "Nudge" for instant feel
            const currentVal = meterAnim._value;
            Animated.spring(meterAnim, {
                toValue: side === 'A' ? currentVal + 5 : currentVal - 5,
                friction: 4,
                useNativeDriver: false,
            }).start();

            await castVote({
                storyId: story.id,
                side: side
            }).unwrap();

            setUserSide(side);
            showToast(`REPPING TEAM ${side === 'A' ? 'CHALLENGER' : 'REBUTTAL'}`);

        } catch (error) {
            console.error("Vote Error:", error);
            // Sync UI back if server fails
            setUserSide(story.userSide || null);
            Alert.alert("Arena Error", error.data?.error || "Could not cast vote.");
        }
    };

    const toggleAudio = (side) => {
        setMutedSide(side === 'A' ? 'B' : 'A');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // --- DYNAMIC VS POSITION ---
    const vsPosition = meterAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [-20, width - 20] // Badge is 40 wide, so -20 centers the seam
    });

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
                    {mutedSide === 'A' && (
                        <View style={styles.muteOverlay}>
                            <Ionicons name="volume-mute" size={40} color="rgba(255,255,255,0.4)" />
                        </View>
                    )}
                </Pressable>

                {/* THE LIVE SHOCK METER */}
                <View style={styles.meterContainer}>
                    <Animated.View style={[styles.meterFillA, {
                        width: meterAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%']
                        })
                    }]} />

                    {/* SLIDING VS BADGE */}
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
                    {mutedSide === 'B' && (
                        <View style={styles.muteOverlay}>
                            <Ionicons name="volume-mute" size={40} color="rgba(255,255,255,0.4)" />
                        </View>
                    )}
                </Pressable>
            </View>

            {/* INTERACTION LAYER */}
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

                <Pressable style={styles.commentPreview}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#666" />
                    <Text style={styles.commentPlaceholder}>Swipe up to join the trash talk...</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    toastContainer: {
        position: 'absolute', top: height * 0.45, alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 25, zIndex: 1000, elevation: 10
    },
    toastText: { color: '#000', fontWeight: '900', fontSize: 14 },
    headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    closeButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', marginLeft: 20, marginTop: Platform.OS === 'android' ? 40 : 10
    },
    arenaContainer: { height: height * 0.72 },
    videoSegment: { flex: 1, backgroundColor: '#050505', overflow: 'hidden' },
    muteOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
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
    meterContainer: { height: 18, width: '100%', backgroundColor: '#00D1FF', flexDirection: 'row', alignItems: 'center', zIndex: 10 },
    meterFillA: { height: '100%', backgroundColor: '#a349a4', borderRightWidth: 2, borderColor: '#fff' },
    vsFloatingBadge: {
        position: 'absolute', top: -11, width: 40, height: 40,
        borderRadius: 20, backgroundColor: '#000', borderWidth: 3, borderColor: '#fff',
        justifyContent: 'center', alignItems: 'center', zIndex: 20
    },
    vsText: { color: '#fff', fontWeight: '900', fontSize: 12 },
    interactionLayer: {
        flex: 1, padding: 20, backgroundColor: '#0A0A0A', borderTopLeftRadius: 30, borderTopRightRadius: 30,
        marginTop: -20, shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.5, shadowRadius: 10,
    },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
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
    commentPlaceholder: { color: '#666', fontSize: 14, marginLeft: 10, fontStyle: 'italic' }
});