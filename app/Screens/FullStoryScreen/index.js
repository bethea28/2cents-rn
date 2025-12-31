import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Dimensions, Pressable,
    Animated, SafeAreaView, Platform
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { height, width } = Dimensions.get('window');

export const FullStoryScreen = ({ route, navigation }) => {
    const { story } = route.params;

    // UI State
    const [mutedSide, setMutedSide] = useState('B'); // Challenger (A) starts unmuted
    const [hasVoted, setHasVoted] = useState(false);

    // Animation Logic for the "Shock" Meter
    const totalVotes = (story.challengerVotes || 0) + (story.rebuttalVotes || 0);
    const initialPercent = totalVotes > 0 ? (story.challengerVotes / totalVotes) * 100 : 50;
    const meterAnim = useRef(new Animated.Value(initialPercent)).current;

    // Set Audio Mode to play even if hardware silent switch is ON
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

    const handleVote = (side) => {
        if (hasVoted) return;

        // Trigger "Shock" Haptics
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setHasVoted(true);

        // Animate the bar to show the "Shock" of the vote
        Animated.spring(meterAnim, {
            toValue: side === 'A' ? initialPercent + 8 : initialPercent - 8,
            friction: 6,
            tension: 40,
            useNativeDriver: false,
        }).start();

        // TODO: Trigger API Call here: updateVote(story.id, side);
        console.log(`Vote cast for ${side}`);
    };
    {/* BOTTOM: REBUTTAL */ }
    const toggleAudio = (side) => {
        // If you tap the Challenger (A), we mute the Rebuttal (B)
        // If you tap the Rebuttal (B), we mute the Challenger (A)
        setMutedSide(side === 'A' ? 'B' : 'A');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // const toggleAudio = (side) => {
    //     if (mutedSide === side) {
    //         // If they tap the already unmuted side, we just give them a small haptic nudge
    //         Haptics.selectionAsync();
    //         return;
    //     }
    //     setMutedSide(side === 'A' ? 'B' : 'A');
    //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // };

    return (
        <View style={styles.container}>
            {/* TOP HEADER OVERLAY */}
            <SafeAreaView style={styles.headerOverlay}>
                <Pressable
                    style={styles.closeButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="close" size={28} color="white" />
                </Pressable>
            </SafeAreaView>

            {/* 1. Remove any comments that might have stray spaces around them */}
            <View style={styles.arenaContainer}>
                {/* TOP: CHALLENGER */}
                <Pressable
                    style={styles.videoSegment}
                    onPress={() => toggleAudio('A')}
                >
                    <Video
                        source={{ uri: story.sideAVideoUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={true}
                        isLooping
                        isMuted={mutedSide === 'A'}
                    />

                    <View style={[styles.sideBadge, mutedSide === 'B' && styles.activeBadge]}>
                        <Ionicons
                            name={mutedSide === 'B' ? "volume-high" : "volume-mute"}
                            size={12}
                            color="white"
                        />
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
                    <View style={styles.vsFloatingBadge}>
                        <Text style={styles.vsText}>VS</Text>
                    </View>
                </View>

                {/* BOTTOM: REBUTTAL */}
                <Pressable
                    style={styles.videoSegment}
                    onPress={() => toggleAudio('B')}
                >
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
                        <Ionicons
                            name={mutedSide === 'A' ? "volume-high" : "volume-mute"}
                            size={12}
                            color="white"
                        />
                    </View>

                    {mutedSide === 'B' && (
                        <View style={styles.muteOverlay}>
                            <Ionicons name="volume-mute" size={40} color="rgba(255,255,255,0.4)" />
                        </View>
                    )}
                </Pressable>
            </View>
            {/* JUDGMENT ZONE (Bottom 28%) */}
            <View style={styles.interactionLayer}>
                <View style={styles.titleRow}>
                    <Text style={styles.storyTitle} numberOfLines={1}>{story.title}</Text>
                    <Text style={styles.wagerText}>{story.wager}</Text>
                </View>

                <View style={styles.voteRow}>
                    <Pressable
                        style={[styles.voteButton, styles.challengerBtn, hasVoted && styles.votedDisabled]}
                        onPress={() => handleVote('A')}
                    >
                        <Text style={styles.voteButtonText}>TEAM CHALLENGER</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.voteButton, styles.rebuttalBtn, hasVoted && styles.votedDisabled]}
                        onPress={() => handleVote('B')}
                    >
                        <Text style={styles.voteButtonText}>TEAM REBUTTAL</Text>
                    </Pressable>
                </View>

                <View style={styles.commentPreview}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#666" />
                    <Text style={styles.commentPlaceholder}>Swipe up to join the trash talk...</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 20,
        marginTop: Platform.OS === 'android' ? 40 : 10
    },
    arenaContainer: { height: height * 0.72 },
    videoSegment: { flex: 1, backgroundColor: '#050505', overflow: 'hidden' },
    muteOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },

    // BADGES & LABELS
    sideBadge: {
        position: 'absolute', top: 20, right: 20,
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20
    },
    sideBadgeBottom: {
        position: 'absolute', bottom: 20, left: 20,
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20
    },
    activeBadge: { backgroundColor: '#a349a4', borderWidth: 1, borderColor: 'white' },
    badgeText: { color: 'white', fontSize: 10, fontWeight: '900', marginHorizontal: 5 },

    // METER STYLING
    meterContainer: {
        height: 18,
        width: '100%',
        backgroundColor: '#00D1FF', // Rebuttal Blue
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    meterFillA: {
        height: '100%',
        backgroundColor: '#a349a4', // Challenger Purple
        borderRightWidth: 2,
        borderColor: '#fff'
    },
    vsFloatingBadge: {
        position: 'absolute',
        left: width / 2 - 20,
        top: -11,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000',
        borderWidth: 3,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20
    },
    vsText: { color: '#fff', fontWeight: '900', fontSize: 12 },

    // INTERACTION LAYER
    interactionLayer: {
        flex: 1, padding: 20,
        backgroundColor: '#0A0A0A',
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
        marginTop: -20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    storyTitle: { color: 'white', fontSize: 24, fontWeight: '900', flex: 1 },
    wagerText: { color: '#FFD700', fontSize: 18, fontWeight: '900', marginLeft: 10 },

    voteRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    voteButton: { flex: 0.48, paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 5 },
    challengerBtn: { backgroundColor: '#a349a4' },
    rebuttalBtn: { backgroundColor: '#00D1FF' },
    votedDisabled: { opacity: 0.2 },
    voteButtonText: { color: '#fff', fontWeight: '900', fontSize: 11 },

    commentPreview: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#161616', padding: 15, borderRadius: 12
    },
    commentPlaceholder: { color: '#666', fontSize: 14, marginLeft: 10, fontStyle: 'italic' }
});