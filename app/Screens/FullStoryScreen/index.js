import React, { useState, useRef, useMemo, useCallback, memo, useEffect } from 'react';
import {
    View, Text, StyleSheet, Dimensions, Pressable,
    SafeAreaView, Platform, ActivityIndicator,
    Keyboard, Animated, LayoutAnimation, UIManager
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BottomSheet, {
    BottomSheetFlatList,
    BottomSheetTextInput,
    BottomSheetFooter
} from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message'

// Custom Components & API
import { CommentItem } from '../../Components/CommentItem';
import { BattleMeter } from '../../Components/BattleMeter';
import {
    usePostCommentMutation,
    useGetCommentsQuery,
    useToggleCommentLikeMutation,
    useCastVoteMutation,
    useGetStoryByIdQuery
} from "@/store/api/api";

const { height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CommentInput = memo(({ replyTarget, setReplyTarget, onSend, isPosting }) => {
    const [text, setText] = useState('');
    const handleInternalSend = () => {
        if (!text.trim() || isPosting) return;
        onSend(text)
        setText('');
    };
    return (
        <View style={styles.stickyFooter}>
            {replyTarget && (
                <View style={styles.replyBar}>
                    <Text style={styles.replyText}>Replying to @{replyTarget.username}</Text>
                    <Pressable onPress={() => setReplyTarget(null)}>
                        <Ionicons name="close-circle" size={16} color="#a349a4" />
                    </Pressable>
                </View>
            )}
            <View style={styles.inputRow}>
                <BottomSheetTextInput
                    style={styles.input}
                    placeholder="Talk your shit..."
                    placeholderTextColor="#666"
                    value={text}
                    onChangeText={setText}
                />
                <Pressable style={styles.sendBtn} onPress={handleInternalSend}>
                    <Ionicons name="send" size={24} color={text.trim() ? "#a349a4" : "#444"} />
                </Pressable>
            </View>
        </View>
    );
});

export const FullStoryScreen = ({ route, navigation }) => {
    const { storyId, initialData } = route.params;
    const { data: liveStory } = useGetStoryByIdQuery(storyId);
    const story = liveStory || initialData;

    const bottomSheetRef = useRef(null);
    const meterAnim = useRef(new Animated.Value(50)).current;

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [expandedSide, setExpandedSide] = useState(null);
    // 🛡️ Logic: Start with Side A unmuted/playing
    const [activeAudioSide, setActiveAudioSide] = useState('A');
    const [replyTarget, setReplyTarget] = useState(null);
    const [voteMessage, setVoteMessage] = useState(null);

    const [postComment, { isLoading: isPosting }] = usePostCommentMutation();
    const [toggleCommentLike] = useToggleCommentLikeMutation();
    const [castVote] = useCastVoteMutation();
    const { data: commentsData, isLoading: isCommentsLoading } = useGetCommentsQuery({ storyId: story?.id });

    const snapPoints = useMemo(() => ['1%', '75%', '96%'], []);

    const handleSheetChange = useCallback((index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSheetOpen(index > 0);
    }, []);

    const toggleExpand = (side) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedSide === side) {
            setExpandedSide(null);
        } else {
            setExpandedSide(side);
            setActiveAudioSide(side); // 🛡️ Switch audio/play focus
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 🛡️ PERFORMANCE: Flattening the comment tree for Butter-Smooth scrolling
    const flattenedComments = useMemo(() => {
        const raw = commentsData?.data || [];
        const result = [];
        const parents = raw.filter(c => !c.parentId);

        parents.forEach(parent => {
            result.push({ ...parent, isReply: false });
            const children = raw.filter(c => c.parentId === parent.id);
            children.forEach(child => {
                result.push({ ...child, isReply: true });
            });
        });
        return result;
    }, [commentsData]);

    const handleVote = async (side) => {
        if (story?.status !== 'active-voting') return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setVoteMessage(`TEAM ${side} JOINED`);
        setTimeout(() => setVoteMessage(null), 1500);
        try { await castVote({ storyId: story.id, side }).unwrap(); } catch (err) { }
    };

    const handleSend = async (content) => {
        try {
            await postComment({ storyId: story.id, content: content.trim(), side: 'Neutral', parentId: replyTarget?.rootId || replyTarget?.id || null }).unwrap();
            setReplyTarget(null);
            Keyboard.dismiss();
            Toast.show({ type: 'success', text1: "Comment sent" });
        } catch (error) { }
    };

    const renderFooter = useCallback((props) => (
        <BottomSheetFooter {...props} bottomInset={0}>
            <CommentInput replyTarget={replyTarget} setReplyTarget={setReplyTarget} onSend={handleSend} isPosting={isPosting} />
        </BottomSheetFooter>
    ), [replyTarget, isPosting]);

    useEffect(() => {
        if (!story) return;
        const totalVotes = (story.challengerVotes || 0) + (story.rebuttalVotes || 0);
        const percentage = totalVotes > 0 ? (story.challengerVotes / totalVotes) * 100 : 50;
        Animated.spring(meterAnim, { toValue: percentage, useNativeDriver: false, tension: 20, friction: 7 }).start();
    }, [story?.challengerVotes, story?.rebuttalVotes]);

    if (!story) return <ActivityIndicator style={{ flex: 1 }} color="#a349a4" />;

    return (
        <View style={styles.container}>
            <View style={styles.arenaContainer}>
                {/* 🛡️ SIDE A */}
                <Pressable
                    style={[styles.videoSegment, expandedSide === 'A' ? { flex: 2 } : expandedSide === 'B' ? { flex: 0.5 } : { flex: 1 }]}
                    onPress={() => toggleExpand('A')}
                >
                    <Video
                        source={{ uri: story.sideAVideoUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.COVER}
                        // 🛡️ CRITICAL: stopPlayback if Side B is the focus
                        shouldPlay={activeAudioSide === 'A'}
                        isLooping
                        isMuted={activeAudioSide !== 'A'}
                    />
                    {story.status === 'active-voting' && (
                        <View style={styles.voteBtnOverlayTop}>
                            <Pressable style={styles.voteBtn} onPress={() => handleVote('A')}>
                                <Text style={styles.voteBtnText}>VOTE A</Text>
                            </Pressable>
                        </View>
                    )}
                </Pressable>

                {!isSheetOpen && (
                    <View style={styles.centerMeterContainer}>
                        <BattleMeter meterAnim={meterAnim} isArenaLit={true} />
                    </View>
                )}

                {/* 🛡️ SIDE B */}
                <Pressable
                    style={[styles.videoSegment, expandedSide === 'B' ? { flex: 2 } : expandedSide === 'A' ? { flex: 0.5 } : { flex: 1 }]}
                    onPress={() => toggleExpand('B')}
                >
                    <Video
                        source={{ uri: story.sideBVideoUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.COVER}
                        // 🛡️ CRITICAL: Only use hardware resource if active
                        shouldPlay={activeAudioSide === 'B'}
                        isLooping
                        isMuted={activeAudioSide !== 'B'}
                    />
                    {story.status === 'active-voting' && (
                        <View style={styles.voteBtnOverlayBottom}>
                            <Pressable style={styles.voteBtn} onPress={() => handleVote('B')}>
                                <Text style={styles.voteBtnText}>VOTE B</Text>
                            </Pressable>
                        </View>
                    )}
                </Pressable>
            </View>

            <SafeAreaView style={styles.headerOverlay} pointerEvents="box-none">
                <View style={styles.scoreboardRow}>
                    <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-down" size={28} color="white" />
                    </Pressable>
                    {isSheetOpen && (
                        <View style={styles.headerMeterWrapper}>
                            <BattleMeter meterAnim={meterAnim} isArenaLit={true} />
                        </View>
                    )}
                    <View style={{ width: 44 }} />
                </View>
            </SafeAreaView>

            <View style={styles.interactionLayer}>
                <Pressable style={styles.commentPreview} onPress={() => bottomSheetRef.current?.snapToIndex(1)}>
                    <Ionicons name="chatbubble-outline" size={20} color="#666" />
                    <Text style={styles.commentPlaceholder}>Join the trash talk...</Text>
                </Pressable>
            </View>

            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                onChange={handleSheetChange}
                backgroundStyle={{ backgroundColor: '#0A0A0A' }}
                handleIndicatorStyle={{ backgroundColor: '#333' }}
                footerComponent={renderFooter}
                keyboardBehavior="interactive"
            >
                <BottomSheetFlatList
                    data={commentsData?.data?.filter(c => !c.parentId) || []} // 🛡️ Only top-level parents
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    removeClippedSubviews={Platform.OS === 'android'}
                    renderItem={({ item }) => (
                        <View>
                            <CommentItem
                                comment={item}
                                isReply={false}
                                onReply={() => {
                                    setReplyTarget({ id: item.id, username: item.author?.username, rootId: item.id });
                                    // 🛡️ Force the sheet up so the keyboard doesn't cover the input
                                    bottomSheetRef.current?.snapToIndex(2);
                                }}
                                onLike={() => onLike(item.id)}
                            />
                            {/* 🛡️ Logic: Find and render replies directly under the parent */}
                            {commentsData?.data
                                ?.filter(reply => reply.parentId === item.id)
                                .map(reply => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        isReply={true}
                                        onReply={() => {
                                            setReplyTarget({ id: reply.id, username: reply.author?.username, rootId: item.id });
                                            bottomSheetRef.current?.snapToIndex(2);
                                        }}
                                        onLike={() => onLike(reply.id)}
                                    />
                                ))
                            }
                        </View>
                    )}
                    ListEmptyComponent={isCommentsLoading ? <ActivityIndicator color="#a349a4" /> : <Text style={styles.emptyText}>No heat yet.</Text>}
                />
            </BottomSheet>

            {voteMessage && (
                <View style={styles.voteFlashOverlay} pointerEvents="none">
                    <Text style={styles.voteFlashText}>{voteMessage}</Text>
                </View>
            )}
            <Toast />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    arenaContainer: { height: height * 0.72, backgroundColor: '#000' },
    videoSegment: { overflow: 'hidden', position: 'relative', backgroundColor: '#050505' },
    centerMeterContainer: { height: 4, zIndex: 10, justifyContent: 'center', backgroundColor: '#000' },
    headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    scoreboardRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 40 : 10 },
    headerMeterWrapper: { flex: 1, marginHorizontal: 15 },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    voteBtnOverlayTop: { position: 'absolute', bottom: 20, left: 20 },
    voteBtnOverlayBottom: { position: 'absolute', bottom: 20, right: 20 },
    voteBtn: { backgroundColor: 'rgba(163, 73, 164, 0.8)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#fff' },
    voteBtnText: { color: '#fff', fontWeight: '900', fontSize: 12 },
    interactionLayer: { flex: 1, padding: 20, backgroundColor: '#0A0A0A' },
    commentPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', padding: 15, borderRadius: 12 },
    commentPlaceholder: { color: '#666', marginLeft: 10 },
    stickyFooter: { backgroundColor: '#0A0A0A', paddingBottom: Platform.OS === 'ios' ? 30 : 10, borderTopWidth: 1, borderTopColor: '#222' },
    replyBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#161616' },
    replyText: { color: '#888', fontSize: 12 },
    inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10 },
    input: { flex: 1, backgroundColor: '#1A1A1A', color: '#fff', padding: 12, borderRadius: 25, fontSize: 16 },
    sendBtn: { marginLeft: 15 },
    voteFlashOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
    voteFlashText: { color: '#fff', fontSize: 32, fontWeight: '900', textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 10 },
    emptyText: { color: '#444', textAlign: 'center', marginTop: 50 }
});