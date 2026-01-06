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
import { useCastVoteMutation, usePostCommentMutation, useGetCommentsQuery } from "@/store/api/api";

const { height, width } = Dimensions.get('window');

export const FullStoryScreen = ({ route, navigation }) => {
    const { story } = route.params;

    // --- REDUX ---
    const [castVote, { isLoading: isVoting }] = useCastVoteMutation();
    const [postComment, { isLoading: isPosting }] = usePostCommentMutation();
    const { data: commentsData, isLoading: isCommentsLoading, isFetching: isCommentsFetching } = useGetCommentsQuery({ storyId: story.id });

    const commentsList = commentsData?.data || [];
    const [commentText, setCommentText] = useState('');
    const [mutedSide, setMutedSide] = useState('B');
    const [userSide, setUserSide] = useState(story.userSide || null);

    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['1%', '60%', '95%'], []);

    const openComments = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        bottomSheetRef.current?.snapToIndex(1);
    };

    const handleSend = async () => {
        if (!commentText.trim() || isPosting) return;
        try {
            await postComment({
                storyId: story.id,
                content: commentText.trim(),
                side: userSide ? userSide : 'Neutral'
            }).unwrap();
            setCommentText('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error("Post Error:", error);
        }
    };

    // --- ANIMATIONS ---
    const initialPercent = useMemo(() => {
        const total = (story.challengerVotes || 0) + (story.rebuttalVotes || 0);
        return total > 0 ? (story.challengerVotes / total) * 100 : 50;
    }, [story.id]);

    const meterAnim = useRef(new Animated.Value(initialPercent)).current;

    useEffect(() => {
        const trueTotal = (story.challengerVotes || 0) + (story.rebuttalVotes || 0);
        const truePercent = trueTotal > 0 ? (story.challengerVotes / trueTotal) * 100 : 50;
        Animated.timing(meterAnim, { toValue: truePercent, duration: 600, useNativeDriver: false }).start();
    }, [story.challengerVotes, story.rebuttalVotes]);

    const handleVote = async (side) => {
        if (isVoting) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await castVote({ storyId: story.id, side: side }).unwrap();
            setUserSide(side);
        } catch (error) {
            Alert.alert("Error", "Could not cast vote.");
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

    return (
        <View style={styles.container}>
            {/* 1. THE ARENA */}
            <View style={styles.arenaContainer}>
                <Pressable style={styles.videoSegment} onPress={() => toggleAudio('A')}>
                    <Video source={{ uri: story.sideAVideoUrl }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={mutedSide === 'A'} />
                </Pressable>

                <View style={styles.meterContainer}>
                    <Animated.View style={[styles.meterFillA, { width: meterAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
                    <Animated.View style={[styles.vsFloatingBadge, { left: vsPosition }]}>
                        <Text style={styles.vsText}>VS</Text>
                    </Animated.View>
                </View>

                <Pressable style={styles.videoSegment} onPress={() => toggleAudio('B')}>
                    <Video source={{ uri: story.sideBVideoUrl }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={mutedSide === 'B'} />
                </Pressable>
            </View>

            {/* 2. BUTTON LAYER */}
            <View style={styles.interactionLayer}>
                <View style={styles.voteRow}>
                    <Pressable style={[styles.voteButton, styles.challengerBtn, userSide === 'B' && styles.inactiveSide]} onPress={() => handleVote('A')}>
                        <Text style={styles.voteButtonText}>{userSide === 'A' ? '✓ TEAM A' : 'VOTE A'}</Text>
                    </Pressable>
                    <Pressable style={[styles.voteButton, styles.rebuttalBtn, userSide === 'A' && styles.inactiveSide]} onPress={() => handleVote('B')}>
                        <Text style={styles.voteButtonText}>{userSide === 'B' ? '✓ TEAM B' : 'VOTE B'}</Text>
                    </Pressable>
                </View>

                <Pressable style={styles.commentPreview} onPress={openComments}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#666" />
                    <Text style={styles.commentPlaceholder}>Swipe up to join the trash talk...</Text>
                </Pressable>
            </View>

            {/* 3. BOTTOM SHEET */}
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: '#0A0A0A' }}
                handleIndicatorStyle={{ backgroundColor: '#333' }}
                containerStyle={{ pointerEvents: 'box-none' }}
                style={{ zIndex: 1000 }}
            >
                <View style={{ flex: 1 }}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.commentHeaderTitle}>TRASH TALK</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <BottomSheetFlatList
                            data={commentsList}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => <CommentItem comment={item} isReply={false} />}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            ListEmptyComponent={isCommentsLoading ? <ActivityIndicator color="#a349a4" /> : <Text style={styles.emptyText}>No heat yet.</Text>}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <BottomSheetTextInput
                            style={styles.input}
                            placeholder="Talk your shit..."
                            placeholderTextColor="#666"
                            value={commentText}
                            onChangeText={setCommentText}
                            onSubmitEditing={handleSend}
                        />
                        <Pressable style={styles.sendBtn} onPress={handleSend} disabled={!commentText.trim() || isPosting}>
                            <Ionicons name="send" size={20} color={commentText.trim() ? "#a349a4" : "#444"} />
                        </Pressable>
                    </View>
                </View>
            </BottomSheet>

            {/* 4. BACK BUTTON (Placed last with high Z-Index to remain clickable) */}
            <SafeAreaView style={styles.headerOverlay} pointerEvents="box-none">
                <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color="white" />
                </Pressable>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    // 🛠 THE FIX: High zIndex and pointerEvents allow this to sit ON TOP of the sheet's container
    headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2000, elevation: 2000 },
    closeButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', marginLeft: 20, marginTop: Platform.OS === 'android' ? 40 : 10
    },
    arenaContainer: { height: height * 0.72 },
    videoSegment: { flex: 1, backgroundColor: '#050505' },
    meterContainer: { height: 18, width: '100%', backgroundColor: '#00D1FF' },
    meterFillA: { height: '100%', backgroundColor: '#a349a4' },
    vsFloatingBadge: { position: 'absolute', top: -11, width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    vsText: { color: '#fff', fontWeight: '900', fontSize: 12 },
    interactionLayer: { flex: 1, padding: 20, backgroundColor: '#0A0A0A', marginTop: -20, zIndex: 1 },
    voteRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    voteButton: { flex: 0.48, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    challengerBtn: { backgroundColor: '#a349a4' },
    rebuttalBtn: { backgroundColor: '#00D1FF' },
    inactiveSide: { opacity: 0.3 },
    voteButtonText: { color: '#fff', fontWeight: '900', fontSize: 11 },
    commentPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', padding: 15, borderRadius: 12 },
    commentPlaceholder: { color: '#666', fontSize: 14, marginLeft: 10 },
    commentHeader: { padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222' },
    commentHeaderTitle: { color: '#fff', fontWeight: '900' },
    inputContainer: {
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        flexDirection: 'row',
        backgroundColor: '#0A0A0A',
        borderTopWidth: 1,
        borderTopColor: '#222'
    },
    input: { flex: 1, backgroundColor: '#1A1A1A', color: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
    sendBtn: { marginLeft: 15, justifyContent: 'center' },
    emptyText: { color: '#444', textAlign: 'center', marginTop: 20 }
});