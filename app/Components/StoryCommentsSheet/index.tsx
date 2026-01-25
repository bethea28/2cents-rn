import React, { useState, useRef, useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Keyboard, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetFlatList, BottomSheetTextInput, BottomSheetFooter } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

import { CommentItem } from '../../Components/CommentItem';
import {
    usePostCommentMutation,
    useGetCommentsQuery,
    useToggleCommentLikeMutation // 🛡️ Import the missing like mutation
} from "@/store/api/api";

const CommentInput = memo(({ replyTarget, setReplyTarget, onSend, isPosting }) => {
    const [text, setText] = useState('');
    const handleSend = () => {
        if (!text.trim() || isPosting) return;
        onSend(text);
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
                <Pressable style={styles.sendBtn} onPress={handleSend}>
                    <Ionicons name="send" size={24} color={text.trim() ? "#a349a4" : "#444"} />
                </Pressable>
            </View>
        </View>
    );
});

export const StoryCommentsSheet = React.forwardRef(({ storyId, onSheetChange }, ref) => {
    const [replyTarget, setReplyTarget] = useState(null);
    const { data: commentsData, isLoading } = useGetCommentsQuery({ storyId });
    const [postComment, { isLoading: isPosting }] = usePostCommentMutation();
    const [toggleLike] = useToggleCommentLikeMutation(); // 🛡️ Hook up the Like action

    const snapPoints = useMemo(() => ['1%', '75%', '96%'], []);



    // 🛡️ REUSABLE LIKE HANDLER with Safety Gate
    const handleLike = useCallback(async (commentId: number) => {
        if (!commentId) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            // 🛡️ THE FIX: Wrap the ID in the object expected by your API
            await toggleLike({ commentId }).unwrap();
            console.log("🔥 Like successful for:", commentId);
        } catch (err) {
            console.error("❌ Failed to like:", err);
        }
    }, [toggleLike]);

    const handleSend = async (content) => {
        try {
            await postComment({
                storyId,
                content: content.trim(),
                side: 'Neutral',
                parentId: replyTarget?.rootId || replyTarget?.id || null
            }).unwrap();
            setReplyTarget(null);
            Keyboard.dismiss();
            Toast.show({ type: 'success', text1: "Comment sent" });
        } catch (error) { }
    };

    const renderFooter = useCallback((props) => (
        <BottomSheetFooter {...props} bottomInset={0}>
            <CommentInput replyTarget={replyTarget} setReplyTarget={setReplyTarget} onSend={handleSend} isPosting={isPosting} />
        </BottomSheetFooter>
    ), [replyTarget, isPosting, handleSend]);

    const parents = useMemo(() => commentsData?.data?.filter(c => !c.parentId) || [], [commentsData]);

    return (
        <BottomSheet
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            onChange={onSheetChange}
            backgroundStyle={{ backgroundColor: '#0A0A0A' }}
            handleIndicatorStyle={{ backgroundColor: '#333' }}
            footerComponent={renderFooter}
            keyboardBehavior="interactive"
        >
            <BottomSheetFlatList
                data={parents}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 120 }}
                // Inside your StoryCommentsSheet renderItem
                renderItem={({ item }) => {
                    // 🛡️ Safety check: identify the real ID
                    const parentId = item.id || item._id;

                    return (
                        <View>
                            <CommentItem
                                comment={item}
                                onReply={() => {
                                    setReplyTarget({ id: parentId, username: item.author?.username, rootId: parentId });
                                    ref.current?.snapToIndex(2);
                                }}
                                onLike={() => handleLike(parentId)} // 🛡️ Pass the safe ID here
                            />

                            {/* Render Replies */}
                            {commentsData?.data?.filter(r => r.parentId === parentId).map(reply => {
                                const replyId = reply.id || reply._id;
                                return (
                                    <CommentItem
                                        key={replyId}
                                        comment={reply}
                                        isReply={true}
                                        onReply={() => {
                                            setReplyTarget({ id: replyId, username: reply.author?.username, rootId: parentId });
                                            ref.current?.snapToIndex(2);
                                        }}
                                        onLike={() => handleLike(replyId)} // 🛡️ Pass the safe ID here
                                    />
                                );
                            })}
                        </View>
                    );
                }}
                ListEmptyComponent={isLoading ? <ActivityIndicator color="#a349a4" /> : <Text style={styles.emptyText}>No heat yet.</Text>}
            />
        </BottomSheet>
    );
});

const styles = StyleSheet.create({
    stickyFooter: { backgroundColor: '#0A0A0A', paddingBottom: Platform.OS === 'ios' ? 30 : 10, borderTopWidth: 1, borderTopColor: '#222' },
    replyBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#161616' },
    replyText: { color: '#888', fontSize: 12 },
    inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10 },
    input: { flex: 1, backgroundColor: '#1A1A1A', color: '#fff', padding: 12, borderRadius: 25, fontSize: 16 },
    sendBtn: { marginLeft: 15 },
    emptyText: { color: '#444', textAlign: 'center', marginTop: 50 }
});