import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, Dimensions, Pressable,
    Animated, SafeAreaView, Platform, Alert, ActivityIndicator,
    TextInput, KeyboardAvoidingView, Keyboard
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { CommentItem } from '../../Components/CommentItem';
import { useCastVoteMutation, usePostCommentMutation, useGetCommentsQuery } from "@/store/api/api";

const { height, width } = Dimensions.get('window');

export const FullStoryScreen = ({ route, navigation }) => {
    const { story } = route.params;

    // --- STATE ---
    const [castVote, { isLoading: isVoting }] = useCastVoteMutation();
    const [postComment, { isLoading: isPosting }] = usePostCommentMutation();
    const { data: commentsData, isLoading: isCommentsLoading } = useGetCommentsQuery({ storyId: story.id });

    const commentsList = commentsData?.data || [];
    const [commentText, setCommentText] = useState('');
    const [mutedSide, setMutedSide] = useState('B');
    const [userSide, setUserSide] = useState(story.userSide || null);
    const [sheetIndex, setSheetIndex] = useState(0); // 🛠 Track if sheet is open

    const [voteMessage, setVoteMessage] = useState(null);
    const toastAnim = useRef(new Animated.Value(0)).current;

    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['1%', '65%', '95%'], []);

    // --- ACTIONS ---
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
            Keyboard.dismiss();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert("Error", "Could not post comment.");
        }
    };

    const showToast = (msg) => {
        setVoteMessage(msg);
        Animated.sequence([
            Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.delay(2000),
            Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setVoteMessage(null));
    };

    // --- ANIMATIONS ---
    const meterAnim = useRef(new Animated.Value(50)).current;
    useEffect(() => {
        const total = (story.challengerVotes || 0) + (story.rebuttalVotes || 0);
        const percent = total > 0 ? (story.challengerVotes / total) * 100 : 50;
        Animated.timing(meterAnim, { toValue: percent, duration: 600, useNativeDriver: false }).start();
    }, [story.challengerVotes, story.rebuttalVotes]);

    const vsPosition = meterAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [-20, width - 20]
    });

    return (
        <View style={styles.container}>
            {/* 1. VOTE TOAST */}
            {voteMessage && (
                <Animated.View style={[styles.toastContainer, { opacity: toastAnim }]}>
                    <Text style={styles.toastText}>{voteMessage}</Text>
                </Animated.View>
            )}

            {/* 2. THE ARENA (Videos) */}
            <View style={styles.arenaContainer}>
                <Pressable style={styles.videoSegment} onPress={() => setMutedSide(mutedSide === 'A' ? 'B' : 'A')}>
                    <Video source={{ uri: story.sideAVideoUrl }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={mutedSide === 'A'} />
                </Pressable>
                <View style={styles.meterContainer}>
                    <Animated.View style={[styles.meterFillA, { width: meterAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
                    <Animated.View style={[styles.vsFloatingBadge, { left: vsPosition }]}>
                        <Text style={styles.vsText}>VS</Text>
                    </Animated.View>
                </View>
                <Pressable style={styles.videoSegment} onPress={() => setMutedSide(mutedSide === 'B' ? 'A' : 'B')}>
                    <Video source={{ uri: story.sideBVideoUrl }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={mutedSide === 'B'} />
                </Pressable>
            </View>

            {/* 3. MAIN INTERACTION BUTTONS */}
            <View style={styles.interactionLayer}>
                <View style={styles.voteRow}>
                    <Pressable style={[styles.voteButton, styles.challengerBtn, userSide === 'B' && styles.inactiveSide]} onPress={() => {
                        castVote({ storyId: story.id, side: 'A' });
                        setUserSide('A');
                        showToast("REPPING TEAM CHALLENGER");
                    }}>
                        <Text style={styles.voteButtonText}>{userSide === 'A' ? '✓ TEAM CHALLENGER' : 'TEAM CHALLENGER'}</Text>
                    </Pressable>
                    <Pressable style={[styles.voteButton, styles.rebuttalBtn, userSide === 'A' && styles.inactiveSide]} onPress={() => {
                        castVote({ storyId: story.id, side: 'B' });
                        setUserSide('B');
                        showToast("REPPING TEAM REBUTTAL");
                    }}>
                        <Text style={styles.voteButtonText}>{userSide === 'B' ? '✓ TEAM REBUTTAL' : 'TEAM REBUTTAL'}</Text>
                    </Pressable>
                </View>
                <Pressable style={styles.commentPreview} onPress={openComments}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#666" />
                    <Text style={styles.commentPlaceholder}>Swipe up to join the trash talk...</Text>
                </Pressable>
            </View>

            {/* 4. THE BOTTOM SHEET (List Only) */}
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                onChange={setSheetIndex}
                backgroundStyle={{ backgroundColor: '#0A0A0A' }}
                handleIndicatorStyle={{ backgroundColor: '#333' }}
                containerStyle={{ pointerEvents: 'box-none' }}
                style={{ zIndex: 1000 }}
            >
                <View style={styles.sheetContent}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.commentHeaderTitle}>TRASH TALK</Text>
                    </View>
                    <BottomSheetFlatList
                        data={commentsList}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => <CommentItem comment={item} isReply={false} />}
                        contentContainerStyle={{ paddingBottom: 120 }}
                        ListEmptyComponent={isCommentsLoading ? <ActivityIndicator color="#a349a4" /> : <Text style={styles.emptyText}>No heat yet.</Text>}
                    />
                </View>
            </BottomSheet>

            {/* 5. PERSISTENT INPUT (Global Layer) */}
            {sheetIndex > 0 && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.globalInputWrapper}
                >
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Talk your shit..."
                            placeholderTextColor="#666"
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline={false}
                        />
                        <Pressable style={styles.sendBtn} onPress={handleSend}>
                            <Ionicons name="send" size={24} color={commentText.trim() ? "#a349a4" : "#444"} />
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            )}

            {/* 6. BACK BUTTON */}
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
    arenaContainer: { height: height * 0.72 },
    videoSegment: { flex: 1, backgroundColor: '#050505' },
    meterContainer: { height: 18, width: '100%', backgroundColor: '#00D1FF' },
    meterFillA: { height: '100%', backgroundColor: '#a349a4' },
    vsFloatingBadge: { position: 'absolute', top: -11, width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    vsText: { color: '#fff', fontWeight: '900', fontSize: 12 },
    interactionLayer: { flex: 1, padding: 20, backgroundColor: '#0A0A0A', marginTop: -20 },
    voteRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    voteButton: { flex: 0.48, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    challengerBtn: { backgroundColor: '#a349a4' },
    rebuttalBtn: { backgroundColor: '#00D1FF' },
    inactiveSide: { opacity: 0.3 },
    voteButtonText: { color: '#fff', fontWeight: '900', fontSize: 11 },
    commentPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', padding: 15, borderRadius: 12 },
    commentPlaceholder: { color: '#666', fontSize: 14, marginLeft: 10 },

    // 🛠 PERSISTENT INPUT STYLES
    globalInputWrapper: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 3000, // Above everything
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15,
        paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 35 : 15,
        backgroundColor: '#0A0A0A', borderTopWidth: 1, borderTopColor: '#222'
    },
    input: { flex: 1, backgroundColor: '#1A1A1A', color: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
    sendBtn: { marginLeft: 15 },

    sheetContent: { flex: 1 },
    commentHeader: { padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222' },
    commentHeaderTitle: { color: '#fff', fontWeight: '900' },
    emptyText: { color: '#444', textAlign: 'center', marginTop: 20 },
    headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4000 },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', marginLeft: 20, marginTop: Platform.OS === 'android' ? 40 : 10 },
    toastContainer: { position: 'absolute', top: height * 0.45, alignSelf: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, zIndex: 5000 },
    toastText: { color: '#000', fontWeight: '900' }
});