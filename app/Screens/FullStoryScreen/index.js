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
        Toast.show({
            type: 'success',
            text1: "Comment sent successfully"
        });
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
    // 🛡️ Staff Engineer: Get ID and initial data from the Profile Reel
    const { storyId, initialData } = route.params;

    // 🛡️ Fetch fresh data while using initialData to prevent flickers
    const { data: liveStory } = useGetStoryByIdQuery(storyId);
    const story = liveStory || initialData;

    const bottomSheetRef = useRef(null);
    const meterAnim = useRef(new Animated.Value(50)).current;

    // --- STATE ---
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [expandedSide, setExpandedSide] = useState(null);
    const [mutedSide, setMutedSide] = useState('B');
    const [replyTarget, setReplyTarget] = useState(null);
    const [voteMessage, setVoteMessage] = useState(null);

    // --- API ---
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
        if (expandedSide === side) setExpandedSide(null);
        else {
            setExpandedSide(side);
            setMutedSide(side === 'A' ? 'B' : 'A');
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleVote = async (side) => {
        if (story?.status !== 'active-voting') return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setVoteMessage(`TEAM ${side} JOINED`);
        setTimeout(() => setVoteMessage(null), 1500);
        try { await castVote({ storyId: story.id, side }).unwrap(); } catch (err) { }
    };
    const onLike = (id) => {
        console.log('like test chris', id)
        toggleCommentLike({ commentId: id })
        Toast.show({
            type: 'success',
            text1: "Like sent successfully"
        });
    }
    useEffect(() => {
        if (!story) return;
        const totalVotes = (story.challengerVotes || 0) + (story.rebuttalVotes || 0);
        const percentage = totalVotes > 0 ? (story.challengerVotes / totalVotes) * 100 : 50;
        Animated.spring(meterAnim, { toValue: percentage, useNativeDriver: false, tension: 20, friction: 7 }).start();
    }, [story?.challengerVotes, story?.rebuttalVotes]);

    const commentsList = useMemo(() => {
        const rawComments = commentsData?.data || [];
        const map = {};
        rawComments.forEach(c => { map[c.id] = { ...c, replies: [] }; });
        const nested = [];
        rawComments.forEach(c => {
            if (c.parentId && map[c.parentId]) map[c.parentId].replies.push(map[c.id]);
            else if (!c.parentId) nested.push(map[c.id]);
        });
        return nested;
    }, [commentsData]);

    const handleSend = async (content) => {
        try {
            await postComment({ storyId: story.id, content: content.trim(), side: 'Neutral', parentId: replyTarget?.rootId || replyTarget?.id || null }).unwrap();
            setReplyTarget(null);
            Keyboard.dismiss();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) { }
    };

    const renderFooter = useCallback((props) => (
        <BottomSheetFooter {...props} bottomInset={0}>
            <CommentInput replyTarget={replyTarget} setReplyTarget={setReplyTarget} onSend={handleSend} isPosting={isPosting} />
        </BottomSheetFooter>
    ), [replyTarget, isPosting]);

    if (!story) return <ActivityIndicator style={{ flex: 1 }} color="#a349a4" />;

    return (
        <View style={styles.container}>
            <View style={styles.arenaContainer}>
                {/* SIDE A */}
                <Pressable
                    style={[styles.videoSegment, expandedSide === 'A' ? { flex: 2 } : expandedSide === 'B' ? { flex: 0.5 } : { flex: 1 }]}
                    onPress={() => toggleExpand('A')}
                >
                    <Video
                        source={{ uri: story.sideAVideoUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted={mutedSide === 'A'}
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

                {/* SIDE B */}
                <Pressable
                    style={[styles.videoSegment, expandedSide === 'B' ? { flex: 2 } : expandedSide === 'A' ? { flex: 0.5 } : { flex: 1 }]}
                    onPress={() => toggleExpand('B')}
                >
                    <Video
                        source={{ uri: story.sideBVideoUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted={mutedSide === 'B'}
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
                        <Ionicons name="close" size={28} color="white" />
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
                    data={commentsList}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <View>
                            <CommentItem
                                comment={item}
                                onReply={() => setReplyTarget({ id: item.id, username: item.author?.username, rootId: null })}
                                onLike={() => onLike(item.id)}
                            />
                            {item.replies?.map(reply => (
                                <CommentItem key={reply.id} comment={reply} isReply={true} onReply={() => setReplyTarget({ id: reply.id, username: reply.author?.username, rootId: item.id })} onLike={() => toggleCommentLike({ commentId: reply.id })} />
                            ))}
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    arenaContainer: { height: height * 0.72, backgroundColor: '#000' },
    videoSegment: { overflow: 'hidden', position: 'relative' },
    centerMeterContainer: { height: 4, zIndex: 10, justifyContent: 'center', backgroundColor: '#000' },
    headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    scoreboardRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 40 : 10 },
    headerMeterWrapper: { flex: 1, marginHorizontal: 15 },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    voteBtnOverlayTop: { position: 'absolute', bottom: 20, left: 20 },
    voteBtnOverlayBottom: { position: 'absolute', bottom: 20, right: 20 },
    voteBtn: { backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#fff' },
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