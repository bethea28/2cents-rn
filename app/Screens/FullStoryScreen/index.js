import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, Dimensions, Pressable, SafeAreaView,
    Platform, ActivityIndicator, Image, LayoutAnimation,
    UIManager, Animated, StyleSheet
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

// COMPONENTS
import { BattleMeter } from '../../Components/BattleMeter';
import { StoryCommentsSheet } from '../../Components/StoryCommentsSheet'; // 🛡️ Import the separate component
import { useCastVoteMutation, useGetStoryByIdQuery } from "@/store/api/api";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MOCK_THUMB = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const FullStoryScreen = ({ route, navigation }) => {
    const { storyId, initialData } = route.params;
    const isFocused = useIsFocused();
    const { data: liveStory } = useGetStoryByIdQuery(storyId);
    const story = liveStory || initialData;

    const bottomSheetRef = useRef(null);
    const meterAnim = useRef(new Animated.Value(50)).current;

    const [expandedSide, setExpandedSide] = useState('B');
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // 🛡️ DYNAMIC VIDEO PLAYERS: Swap source to save RAM on S8
    const playerA = useVideoPlayer(expandedSide === 'A' ? story?.sideAVideoUrl : null, (p) => {
        p.loop = true;
        if (isFocused) p.play();
    });

    const playerB = useVideoPlayer(expandedSide === 'B' ? story?.sideBVideoUrl : null, (p) => {
        p.loop = true;
        if (isFocused) p.play();
    });

    // 🛡️ SYNC METER POSITION
    useEffect(() => {
        Animated.spring(meterAnim, {
            toValue: expandedSide === 'A' ? 15 : 85,
            useNativeDriver: false
        }).start();
    }, [expandedSide]);

    // 🛡️ AUTO-PAUSE ON NAVIGATION
    useEffect(() => {
        if (!isFocused) {
            playerA?.pause();
            playerB?.pause();
        } else {
            (expandedSide === 'A' ? playerA : playerB)?.play();
        }
    }, [isFocused, expandedSide]);

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
            Toast.show({ type: 'success', text1: `Voted for ${side === 'A' ? 'Original' : 'Challenger'}` });
        } catch (err) { }
    };

    if (!story) return <ActivityIndicator style={{ flex: 1 }} color="#a349a4" />;

    return (
        <View style={styles.container}>
            <View style={styles.arenaContainer}>

                {/* --- SIDE A (TOP) --- */}
                <Pressable
                    style={[styles.videoSegment, expandedSide === 'A' ? { flex: 3 } : { flex: 1 }]}
                    onPress={() => toggleExpand('A')}
                >
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
                        <View style={styles.peekContainer}>
                            <Image source={{ uri: MOCK_THUMB }} style={styles.thumbnail} blurRadius={5} />
                            <View style={styles.peekOverlay}>
                                <Text style={styles.peekText}>VIEW ORIGINAL</Text>
                            </View>
                        </View>
                    )}
                </Pressable>

                {/* 🛡️ THE METER (Hidden when sheet is full screen) */}
                {!isSheetOpen && (
                    <View style={styles.centerMeterContainer}>
                        <BattleMeter meterAnim={meterAnim} isArenaLit={true} />
                    </View>
                )}

                {/* --- SIDE B (BOTTOM) --- */}
                <Pressable
                    style={[styles.videoSegment, expandedSide === 'B' ? { flex: 3 } : { flex: 1 }]}
                    onPress={() => toggleExpand('B')}
                >
                    {expandedSide === 'B' ? (
                        <>
                            <VideoView player={playerB} style={styles.fullVideo} contentFit="cover" />
                            <View style={styles.voteBtnOverlayBottom}>
                                <Pressable style={[styles.voteBtn, { backgroundColor: '#00D4FF' }]} onPress={() => handleVote('B')}>
                                    <Text style={styles.voteBtnText}>VOTE B</Text>
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <View style={styles.peekContainer}>
                            <Image source={{ uri: MOCK_THUMB }} style={styles.thumbnail} blurRadius={5} />
                            <View style={styles.peekOverlay}>
                                <Text style={styles.peekText}>VIEW CHALLENGER</Text>
                            </View>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Engagement Layer */}
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

            {/* 🛡️ SEPARATE COMPONENT FOR LOGIC ISOLATION */}
            <StoryCommentsSheet
                ref={bottomSheetRef}
                storyId={story.id}
                onSheetChange={(idx) => setIsSheetOpen(idx > 1)}
            />

            <Toast />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    arenaContainer: { height: SCREEN_HEIGHT * 0.82, backgroundColor: '#000' },
    videoSegment: { overflow: 'hidden', position: 'relative', backgroundColor: '#050505' },
    fullVideo: { flex: 1 },
    peekContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    thumbnail: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
    peekOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    peekText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
    centerMeterContainer: { height: 4, zIndex: 10, backgroundColor: '#000', justifyContent: 'center' },
    headerOverlay: { position: 'absolute', top: 0, left: 15, zIndex: 100 },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    voteBtnOverlayTop: { position: 'absolute', bottom: 20, left: 20 },
    voteBtnOverlayBottom: { position: 'absolute', bottom: 20, right: 20 },
    voteBtn: { backgroundColor: 'rgba(163, 73, 164, 0.8)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, borderWidth: 1, borderColor: '#fff' },
    voteBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
    interactionLayer: { flex: 1, backgroundColor: '#0A0A0A', padding: 20, justifyContent: 'center' },
    commentPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', padding: 15, borderRadius: 12 },
    commentPlaceholder: { color: '#666', marginLeft: 10 }
});