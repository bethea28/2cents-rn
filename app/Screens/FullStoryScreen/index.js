import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, Dimensions, Pressable,
    Animated, SafeAreaView, Platform, Alert, ActivityIndicator,
    TextInput, Keyboard, KeyboardAvoidingView
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetFlatList, BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';

// Custom Components & API
import { CommentItem } from '../../Components/CommentItem';
import {
    usePostCommentMutation,
    useGetCommentsQuery,
    useToggleCommentLikeMutation
} from "@/store/api/api";

const { height } = Dimensions.get('window');

export const FullStoryScreen = ({ route, navigation }) => {
    const { story } = route.params;

    // --- API ---
    const [postComment, { isLoading: isPosting }] = usePostCommentMutation();
    const [toggleCommentLike] = useToggleCommentLikeMutation();
    const { data: commentsData, isLoading: isCommentsLoading } = useGetCommentsQuery({ storyId: story.id });

    // --- REFS & STATE ---
    const bottomSheetRef = useRef(null);
    const [commentText, setCommentText] = useState('');
    const [replyTarget, setReplyTarget] = useState(null);
    const [mutedSide, setMutedSide] = useState('B');
    const [sheetIndex, setSheetIndex] = useState(0);

    // 🛠️ Increased snap points to ensure "Full Screen" actually means full screen
    const snapPoints = useMemo(() => ['1%', '75%', '96%'], []);

    // --- DATA ---
    const commentsList = useMemo(() => {
        const rawComments = commentsData?.data || [];
        const map = {};
        rawComments.forEach(c => { map[c.id] = { ...c, replies: [] }; });
        const nested = [];
        rawComments.forEach(c => {
            if (c.parentId && map[c.parentId]) {
                map[c.parentId].replies.push(map[c.id]);
            } else if (!c.parentId) {
                nested.push(map[c.id]);
            }
        });
        return nested;
    }, [commentsData]);

    // --- HANDLERS ---
    const handleSend = async () => {
        if (!commentText.trim() || isPosting) return;
        try {
            await postComment({
                storyId: story.id,
                content: commentText.trim(),
                side: 'Neutral',
                parentId: replyTarget?.rootId || replyTarget?.id || null
            }).unwrap();
            setCommentText('');
            setReplyTarget(null);
            Keyboard.dismiss();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert("Error", "Could not post.");
        }
    };

    // 🛠️ FIX: Custom Footer Component that stays sticky at the bottom of the Sheet
    const renderFooter = useCallback(() => (
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
                {/* 🛠️ IMPORTANT: Use BottomSheetTextInput for proper keyboard handling */}
                <BottomSheetTextInput
                    style={styles.input}
                    placeholder="Talk your shit..."
                    placeholderTextColor="#666"
                    value={commentText}
                    onChangeText={setCommentText}
                />
                <Pressable style={styles.sendBtn} onPress={handleSend}>
                    <Ionicons name="send" size={24} color={commentText.trim() ? "#a349a4" : "#444"} />
                </Pressable>
            </View>
        </View>
    ), [commentText, replyTarget]);

    return (
        <View style={styles.container}>
            {/* VIDEO ARENA */}
            <View style={styles.arenaContainer}>
                <Pressable style={styles.videoSegment} onPress={() => setMutedSide(mutedSide === 'A' ? 'B' : 'A')}>
                    <Video source={{ uri: story.sideAVideoUrl }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={mutedSide === 'A'} />
                </Pressable>
                <Pressable style={styles.videoSegment} onPress={() => setMutedSide(mutedSide === 'B' ? 'A' : 'B')}>
                    <Video source={{ uri: story.sideBVideoUrl }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={mutedSide === 'B'} />
                </Pressable>
            </View>

            {/* PREVIEW BAR */}
            <View style={styles.interactionLayer}>
                <Pressable style={styles.commentPreview} onPress={() => bottomSheetRef.current?.snapToIndex(1)}>
                    <Ionicons name="chatbubble-outline" size={20} color="#666" />
                    <Text style={styles.commentPlaceholder}>Join the trash talk...</Text>
                </Pressable>
            </View>

            {/* BOTTOM SHEET */}
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                onChange={setSheetIndex}
                backgroundStyle={{ backgroundColor: '#0A0A0A' }}
                handleIndicatorStyle={{ backgroundColor: '#333' }}
                // 🛠️ STICKY FOOTER: This puts the input bar INSIDE the sheet
                footerComponent={renderFooter}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
            >
                <BottomSheetFlatList
                    data={commentsList}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 100 }} // Normal padding is fine now
                    renderItem={({ item }) => (
                        <View>
                            <CommentItem
                                comment={item}
                                onReply={() => setReplyTarget({ id: item.id, username: item.author?.username, rootId: null })}
                                onLike={() => toggleCommentLike({ commentId: item.id })}
                            />
                            {item.replies?.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    isReply={true}
                                    onReply={() => setReplyTarget({ id: reply.id, username: reply.author?.username, rootId: item.id })}
                                    onLike={() => toggleCommentLike({ commentId: reply.id })}
                                />
                            ))}
                        </View>
                    )}
                    ListEmptyComponent={isCommentsLoading ? <ActivityIndicator /> : <Text style={styles.emptyText}>No heat yet.</Text>}
                />
            </BottomSheet>

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
    videoSegment: { flex: 1 },
    interactionLayer: { flex: 1, padding: 20, backgroundColor: '#0A0A0A' },
    commentPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', padding: 15, borderRadius: 12 },
    commentPlaceholder: { color: '#666', marginLeft: 10 },

    // 🛠️ NEW STICKY FOOTER STYLES
    stickyFooter: { backgroundColor: '#0A0A0A', paddingBottom: Platform.OS === 'ios' ? 30 : 10, borderTopWidth: 1, borderTopColor: '#222' },
    replyBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#161616' },
    replyText: { color: '#888', fontSize: 12 },
    inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10 },
    input: { flex: 1, backgroundColor: '#1A1A1A', color: '#fff', padding: 12, borderRadius: 25, fontSize: 16 },
    sendBtn: { marginLeft: 15 },

    headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', marginLeft: 20, marginTop: 10 },
    emptyText: { color: '#444', textAlign: 'center', marginTop: 50 }
});