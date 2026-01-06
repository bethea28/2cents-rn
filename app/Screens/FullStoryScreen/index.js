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
    const [castVote] = useCastVoteMutation();
    const [postComment, { isLoading: isPosting }] = usePostCommentMutation();
    const { data: commentsData, isLoading: isCommentsLoading } = useGetCommentsQuery({ storyId: story.id });
    const inputRef = useRef(null); // 🛠 This fixes the "doesn't exist" error

    const commentsList = commentsData?.data || [];
    const [commentText, setCommentText] = useState('');
    const [mutedSide, setMutedSide] = useState('B');
    const [userSide, setUserSide] = useState(story.userSide || null);
    const [sheetIndex, setSheetIndex] = useState(0);

    // 🛠 REPLIES STATE
    const [replyTarget, setReplyTarget] = useState(null); // { id: 1, username: 'johndoe' }

    const [voteMessage, setVoteMessage] = useState(null);
    const toastAnim = useRef(new Animated.Value(0)).current;
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ['1%', '65%', '95%'], []);

    // --- ACTIONS ---
    const handleSend = async () => {
        if (!commentText.trim() || isPosting) return;
        try {
            await postComment({
                storyId: story.id,
                content: commentText.trim(),
                side: userSide || 'Neutral',
                parentId: replyTarget?.id || null // 🛠 Send parentId if replying
            }).unwrap();

            setCommentText('');
            setReplyTarget(null); // Reset reply mode
            Keyboard.dismiss();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert("Error", "Could not post.");
        }
    };

    const showToast = (msg) => {
        setVoteMessage(msg);
        Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        setTimeout(() => {
            Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setVoteMessage(null));
        }, 2000);
    };

    return (
        <View style={styles.container}>
            {/* VOTE TOAST */}
            {voteMessage && (
                <Animated.View style={[styles.toastContainer, { opacity: toastAnim }]}>
                    <Text style={styles.toastText}>{voteMessage}</Text>
                </Animated.View>
            )}

            {/* ARENA */}
            <View style={styles.arenaContainer}>
                <Pressable style={styles.videoSegment} onPress={() => setMutedSide(mutedSide === 'A' ? 'B' : 'A')}>
                    <Video source={{ uri: story.sideAVideoUrl }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={mutedSide === 'A'} />
                </Pressable>
                <Pressable style={styles.videoSegment} onPress={() => setMutedSide(mutedSide === 'B' ? 'A' : 'B')}>
                    <Video source={{ uri: story.sideBVideoUrl }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={mutedSide === 'B'} />
                </Pressable>
            </View>

            {/* INTERACTION LAYER */}
            <View style={styles.interactionLayer}>
                <Pressable style={styles.commentPreview} onPress={() => bottomSheetRef.current?.snapToIndex(1)}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#666" />
                    <Text style={styles.commentPlaceholder}>Swipe up to join the trash talk...</Text>
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
                containerStyle={{ pointerEvents: 'box-none' }}
            >
                <View style={{ flex: 1 }}>
                    <View style={styles.commentHeader}><Text style={styles.commentHeaderTitle}>TRASH TALK</Text></View>
                    <BottomSheetFlatList
                        data={commentsList}
                        keyExtractor={(item) => item.id.toString()}
                        // 🛠 PASS ONREPLY TO ITEM
                        renderItem={({ item }) => (
                            <CommentItem
                                comment={item}
                                isReply={item.parentId !== null}
                                onReply={() => {
                                    // 🛠 Path fix: Use item.author?.username to match your CommentItem
                                    const targetName = item.author?.username || 'User';

                                    setReplyTarget({
                                        id: item.id,
                                        username: targetName
                                    });

                                    // 🛠 Safety check: only call focus if the ref is connected
                                    if (inputRef.current) {
                                        inputRef.current.focus();
                                    }

                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            />
                        )}
                        contentContainerStyle={{ paddingBottom: 150 }}
                        ListEmptyComponent={isCommentsLoading ? <ActivityIndicator color="#a349a4" /> : <Text style={styles.emptyText}>No heat yet.</Text>}
                    />
                </View>
            </BottomSheet>

            {/* 🛠 PERSISTENT INPUT WITH REPLY BAR */}
            {sheetIndex > 0 && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.globalInputWrapper}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // Adjust this number as needed
                >
                    {/* THE DESIGNER'S REPLY BAR */}
                    {replyTarget && (
                        <View style={styles.replyBar}>
                            <Text style={styles.replyText}>Replying to <Text style={{ fontWeight: 'bold' }}>@{replyTarget.username}</Text></Text>
                            <Pressable onPress={() => setReplyTarget(null)}>
                                <Ionicons name="close-circle" size={18} color="#a349a4" />
                            </Pressable>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <TextInput
                            ref={inputRef} // 🛠 This connects the logic to the physical box
                            style={styles.input}
                            placeholder={replyTarget ? `Reply to @${replyTarget.username}...` : "Talk your shit..."}
                            placeholderTextColor="#666"
                            value={commentText}
                            onChangeText={setCommentText}
                        />
                        <Pressable style={styles.sendBtn} onPress={handleSend}>
                            <Ionicons name="send" size={24} color={commentText.trim() ? "#a349a4" : "#444"} />
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            )}

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
    interactionLayer: { flex: 1, padding: 20, backgroundColor: '#0A0A0A' },
    commentPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', padding: 15, borderRadius: 12 },
    commentPlaceholder: { color: '#666', fontSize: 14, marginLeft: 10 },
    globalInputWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3000 },

    // 🎨 DESIGNER'S REPLY BAR STYLE
    replyBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#1A1A1A', paddingHorizontal: 20, paddingVertical: 8,
        borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomWidth: 1, borderBottomColor: '#333'
    },
    replyText: { color: '#888', fontSize: 12 },

    inputContainer: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15,
        paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 35 : 15,
        backgroundColor: '#0A0A0A'
    },
    input: { flex: 1, backgroundColor: '#1A1A1A', color: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
    sendBtn: { marginLeft: 15 },
    commentHeader: { padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222' },
    commentHeaderTitle: { color: '#fff', fontWeight: '900' },
    headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4000 },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', marginLeft: 20, marginTop: Platform.OS === 'android' ? 40 : 10 },
    toastContainer: { position: 'absolute', top: height * 0.45, alignSelf: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, zIndex: 5000 },
    toastText: { color: '#000', fontWeight: '900' }
});