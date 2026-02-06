import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, Dimensions, Pressable, SafeAreaView,
    Platform, ActivityIndicator, Image, LayoutAnimation,
    UIManager, Animated, StyleSheet, ImageBackground
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

// COMPONENTS & HOOKS
import { BattleMeter } from '../../Components/BattleMeter';
import { StoryCommentsSheet } from '../../Components/StoryCommentsSheet';
import { useCastVoteMutation, useGetStoryByIdQuery } from "@/store/api/api";
import CreateStoryModal from '../../Modals/CreateStoryModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MOCK_THUMB = 'https://via.placeholder.com/400x800';

export const FullStoryScreen = ({ route, navigation }) => {
    const { storyId, initialData } = route.params;
    const isFocused = useIsFocused();

    // 🛡️ API DATA
    const { data: liveStory } = useGetStoryByIdQuery(storyId, {
        pollingInterval: 10000,
    });
    const story = liveStory || initialData;

    // 🛡️ STAFF LOGIC: Start on Side B if video exists, otherwise start on Side A
    const getInitialSide = () => {
        return story?.sideBVideoUrl ? 'B' : 'A';
    };

    const [expandedSide, setExpandedSide] = useState(getInitialSide());
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const initialScore = useMemo(() => {
        const votesA = story?.sideAVotes || 0;
        const votesB = story?.sideBVotes || 0;
        const total = votesA + votesB;
        return total === 0 ? 50 : (votesA / total) * 100;
    }, [story]);

    const bottomSheetRef = useRef(null);
    const focusAnim = useRef(new Animated.Value(expandedSide === 'A' ? 15 : 85)).current;
    const voteAnim = useRef(new Animated.Value(initialScore)).current;

    // --- VIDEO PLAYERS ---
    const playerA = useVideoPlayer(story?.sideAVideoUrl, (p) => {
        p.loop = true;
        p.muted = expandedSide !== 'A';
    });

    const playerB = useVideoPlayer(story?.sideBVideoUrl, (p) => {
        p.loop = true;
        p.muted = expandedSide !== 'B';
    });

    // --- ANIMATION EFFECTS ---
    useEffect(() => {
        Animated.spring(focusAnim, {
            toValue: expandedSide === 'A' ? 15 : 85,
            useNativeDriver: false,
            tension: 50,
            friction: 7
        }).start();
    }, [expandedSide]);

    useEffect(() => {
        if (story) {
            const votesA = story.sideAVotes || 0;
            const votesB = story.sideBVotes || 0;
            const total = votesA + votesB;
            const percentageA = total === 0 ? 50 : (votesA / total) * 100;

            Animated.spring(voteAnim, {
                toValue: percentageA,
                friction: 6,
                tension: 40,
                useNativeDriver: false
            }).start();
        }
    }, [story?.sideAVotes, story?.sideBVotes]);

    // 🛡️ MASTER CONTROL: Sync Audio and Playback
    useEffect(() => {
        if (!isFocused || isCreateModalOpen || isSheetOpen) {
            playerA.pause();
            playerB.pause();
        } else {
            if (expandedSide === 'A') {
                playerB.pause();
                playerB.muted = true;
                playerA.play();
                playerA.muted = false;
            } else {
                playerA.pause();
                playerA.muted = true;
                if (story?.sideBVideoUrl) {
                    playerB.play();
                    playerB.muted = false;
                }
            }
        }
    }, [isFocused, isCreateModalOpen, expandedSide, isSheetOpen, story?.sideBVideoUrl]);

    const toggleExpand = (side) => {
        if (expandedSide !== side) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpandedSide(side);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const [castVote] = useCastVoteMutation();
    const handleVote = async (side) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            await castVote({ storyId: story.id, side }).unwrap();
            Toast.show({ type: 'success', text1: `Voted for ${side === 'A' ? 'Challenger' : 'Rebuttal'}` });
        } catch (err) {
            console.error("Vote failed", err);
        }
    };

    if (!story) return <ActivityIndicator style={{ flex: 1 }} color="#a349a4" />;

    return (
        <View style={styles.container}>
            <View style={styles.arenaContainer}>

                {/* --- SIDE A (TOP/ORIGINAL) --- */}
                <Pressable
                    style={[styles.videoSegment, expandedSide === 'A' ? { flex: 3 } : { flex: 1 }]}
                    onPress={() => toggleExpand('A')}
                >
                    <Image source={{ uri: story?.sideAThumbnailUrl || MOCK_THUMB }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    {expandedSide === 'A' ? (
                        <>
                            <VideoView player={playerA} style={styles.fullVideo} contentFit="cover" />
                            <View style={styles.voteBtnOverlayTop}>
                                <Pressable style={styles.voteBtn} onPress={() => handleVote('A')}>
                                    <Text style={styles.voteBtnText}>VOTE A</Text>
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <View style={styles.peekOverlay}>
                            <Text style={styles.peekText}>VIEW CHALLENGER</Text>
                        </View>
                    )}
                </Pressable>

                {/* 🛡️ BATTLE METER */}
                <View style={styles.centerMeterContainer}>
                    <BattleMeter
                        focusAnim={focusAnim}
                        voteAnim={voteAnim}
                        isArenaLit={!isSheetOpen}
                        initialValue={initialScore}
                    />
                </View>

                {/* --- SIDE B (BOTTOM/REBUTTAL) --- */}
                <Pressable
                    style={[styles.videoSegment, expandedSide === 'B' ? { flex: 3 } : { flex: 1 }]}
                    onPress={() => toggleExpand('B')}
                >
                    {expandedSide === 'B' ? (
                        <>
                            {story.sideBVideoUrl ? (
                                <VideoView player={playerB} style={styles.fullVideo} contentFit="cover" />
                            ) : (
                                /* 🛡️ THE REQUESTED PLACEHOLDER UX */
                                <ImageBackground
                                    source={{ uri: story?.SideB?.profilePic || MOCK_THUMB }}
                                    style={styles.fullVideo}
                                    blurRadius={15}
                                >
                                    <View style={styles.placeholderOverlay}>
                                        <View style={styles.avatarCircle}>
                                            <Image
                                                source={{ uri: story?.SideB?.profilePic || MOCK_THUMB }}
                                                style={styles.avatarLarge}
                                            />
                                            <View style={styles.timerBadge}>
                                                <Ionicons name="time" size={16} color="white" />
                                            </View>
                                        </View>
                                        <Text style={styles.waitingText}>Waiting for @{story?.SideB?.username || 'Opponent'}</Text>
                                        <Text style={styles.subWaitingText}>Challenge has been issued.</Text>
                                    </View>
                                </ImageBackground>
                            )}

                            <View style={styles.voteBtnOverlayBottom}>
                                {!story.sideBVideoUrl && (
                                    <Pressable style={styles.rebuttalBtn} onPress={() => setIsCreateModalOpen(true)}>
                                        <Text style={styles.rebuttalBtnText}>ANSWER CALL</Text>
                                    </Pressable>
                                )}
                                {story.sideBVideoUrl && (
                                    <Pressable style={[styles.voteBtn, { backgroundColor: '#00D4FF' }]} onPress={() => handleVote('B')}>
                                        <Text style={styles.voteBtnText}>VOTE B</Text>
                                    </Pressable>
                                )}
                            </View>
                        </>
                    ) : (
                        <View style={styles.peekOverlay}>
                            <Image source={{ uri: story?.SideB?.profilePic || MOCK_THUMB }} style={styles.peekAvatar} />
                            <Text style={styles.peekText}>VIEW REBUTTAL</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            <View style={styles.interactionLayer}>
                <Pressable style={styles.commentPreview} onPress={() => bottomSheetRef.current?.snapToIndex(1)}>
                    <Ionicons name="chatbubble-outline" size={20} color="#666" />
                    <Text style={styles.commentPlaceholder}>Join the trash talk...</Text>
                </Pressable>
            </View>

            <SafeAreaView style={styles.headerOverlay} pointerEvents="box-none">
                <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-down" size={28} color="white" />
                </Pressable>
            </SafeAreaView>

            <StoryCommentsSheet
                ref={bottomSheetRef}
                storyId={story.id}
                onSheetChange={(idx) => setIsSheetOpen(idx > 0)}
            />

            <CreateStoryModal
                visible={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                mode="rebuttal"
                storyId={story.id}
            />

            <Toast />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    arenaContainer: { height: SCREEN_HEIGHT * 0.82, backgroundColor: '#000' },
    videoSegment: { overflow: 'hidden', position: 'relative', backgroundColor: '#050505' },
    fullVideo: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    peekOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
    peekText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 5 },
    peekAvatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#a349a4' },

    // Placeholder UX Styles
    placeholderOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    avatarCircle: { width: 120, height: 120, position: 'relative', marginBottom: 15 },
    avatarLarge: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#a349a4' },
    timerBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#a349a4', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#000' },
    waitingText: { color: '#fff', fontSize: 20, fontWeight: '900' },
    subWaitingText: { color: '#a349a4', fontSize: 13, fontWeight: '600', marginTop: 5 },

    centerMeterContainer: { height: 40, zIndex: 10, backgroundColor: '#000', justifyContent: 'center', overflow: 'visible' },
    headerOverlay: { position: 'absolute', top: 0, left: 15, zIndex: 100 },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    voteBtnOverlayTop: { position: 'absolute', bottom: 20, left: 20 },
    voteBtnOverlayBottom: { position: 'absolute', bottom: 20, right: 20, alignItems: 'flex-end', gap: 10 },
    voteBtn: { backgroundColor: 'rgba(163, 73, 164, 0.9)', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 30, borderWidth: 1.5, borderColor: '#fff' },
    voteBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    rebuttalBtn: { backgroundColor: '#FF3B30', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 30, borderWidth: 1.5, borderColor: '#fff' },
    rebuttalBtnText: { color: 'white', fontWeight: '900', fontSize: 13 },
    interactionLayer: { flex: 1, backgroundColor: '#0A0A0A', padding: 20, justifyContent: 'center' },
    commentPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', padding: 15, borderRadius: 12 },
    commentPlaceholder: { color: '#666', marginLeft: 10, fontSize: 14 }
});