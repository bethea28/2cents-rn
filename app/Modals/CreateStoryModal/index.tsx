import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import {
    View, Text, TouchableOpacity, Modal, TextInput,
    Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Audio } from 'expo-av';
import { Video as VideoCompressor } from 'react-native-compressor'; // 🛡️ Added
import { Ionicons } from '@expo/vector-icons';
import { useCreateStoryMutation, useHandleStoryRebuttalMutation } from "@/store/api/api";
import Toast from 'react-native-toast-message';

const STEPS = { RECORD: 1, FORM: 2, SUCCESS: 3 };

export default function CreateStoryModal({ visible, onClose, storyId = null, mode = 'new' }) {
    // --- API ---
    const [createStory, { isLoading: isCreating }] = useCreateStoryMutation();
    const [handleRebuttal, { isLoading: isRebutting }] = useHandleStoryRebuttalMutation();
    const [camPerm, requestCam] = useCameraPermissions();
    const [micPerm, requestMic] = useMicrophonePermissions();

    // --- STATE ---
    const [step, setStep] = useState(STEPS.RECORD);
    const [isRecording, setIsRecording] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false); // 🛡️ Added
    const [videoUri, setVideoUri] = useState(null);
    const [facing, setFacing] = useState('back');
    const [form, setForm] = useState({ title: '', opponent: '', stake: 'Lunch' });

    const cameraRef = useRef(null);
    const isUploading = isCreating || isRebutting || isCompressing;

    // --- PREVIEW PLAYER ---
    const player = useVideoPlayer(videoUri, (p) => {
        p.loop = true;
        if (videoUri) p.play();
    });

    useLayoutEffect(() => {
        const manageAudioSession = async () => {
            try {
                if (visible) {
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: true,
                        interruptionModeIOS: 1,
                        playsInSilentModeIOS: true,
                        shouldDuckAndroid: true,
                        staysActiveInBackground: false,
                        playThroughEarpieceAndroid: false,
                    });
                } else {
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: false,
                        interruptionModeIOS: 1,
                        playsInSilentModeIOS: true,
                    });
                }
            } catch (e) {
                console.error("Audio Mode Hijack Failed:", e);
            }
        };
        manageAudioSession();
    }, [visible]);

    const resetFlow = useCallback(() => {
        setStep(STEPS.RECORD);
        setVideoUri(null);
        setForm({ title: '', opponent: '', stake: 'Lunch' });
        setIsRecording(false);
        setIsCompressing(false);
    }, []);

    useEffect(() => {
        if (!visible) resetFlow();
    }, [visible, resetFlow]);

    const handleRecordPress = async () => {
        if (!cameraRef.current || isRecording) return;
        try {
            setIsRecording(true);
            const video = await cameraRef.current.recordAsync({
                maxDuration: 60,
                quality: '480p'
            });
            setVideoUri(video.uri);
            setStep(STEPS.FORM);
        } catch (e) {
            setIsRecording(false);
            Alert.alert("Error", "Could not start recording.");
        }
    };

    const stopRecording = () => {
        if (isRecording) {
            cameraRef.current?.stopRecording();
            setIsRecording(false);
        }
    };

    const handleFinish = async () => {
        // 🛡️ Safety check: Don't start if we're already uploading or if the video is missing
        if (!videoUri || isUploading) return;

        try {
            // 🛡️ 1. COMPRESSION STEP (The "Crunch")
            setIsCompressing(true);
            console.log("🛡️ Arena: Starting compression for", videoUri);

            const compressedUri = await VideoCompressor.compress(
                videoUri,
                {
                    compressionMethod: 'manual', // 🛡️ Manual is safer for older Android CPUs
                    maxResolution: 720,          // 🛡️ 720p is the industry standard for mobile social apps
                    bitrate: 2000000,            // 🛡️ 2Mbps keeps the file small but sharp
                    minimumFileSizeForCompress: 1024 * 1024, // 1MB
                },
                (progress) => {
                    // Optional: You could track real-time crunch progress here
                    console.log(`Compression Progress: ${Math.round(progress * 100)}%`);
                }
            );

            setIsCompressing(false);
            console.log("🛡️ Arena: Compression complete ->", compressedUri);

            // 🛡️ 2. PREPARE FORMDATA
            const formData = new FormData();

            // We use the compressedUri here
            // @ts-ignore
            formData.append('video', {
                uri: Platform.OS === 'android' ? compressedUri : compressedUri.replace('file://', ''),
                name: `arena_upload_${Date.now()}.mp4`,
                type: 'video/mp4'
            });

            // 🛡️ 3. BRANCHING LOGIC (Rebuttal vs. New Case)
            if (mode === 'rebuttal') {
                console.log("🛡️ Arena: Submitting Rebuttal for ID:", storyId);
                await handleRebuttal({ id: storyId, formData }).unwrap();
            } else {
                // Validate form before starting the upload
                if (!form.title || !form.opponent) {
                    return Alert.alert("Wait", "Headline your case and name your opponent.");
                }

                formData.append('title', form.title);
                formData.append('opponentHandle', form.opponent.replace('@', '')); // Strip @ if they typed it
                formData.append('wager', form.stake);
                formData.append('storyType', 'call-out');

                console.log("🛡️ Arena: Submitting New Call-out");
                await createStory(formData).unwrap();
            }

            // 🛡️ 4. UI SUCCESS
            setStep(STEPS.SUCCESS);
            Toast.show({
                type: 'success',
                text1: 'Case Filed!',
                text2: 'The Arena has received your evidence.'
            });

        } catch (err) {
            setIsCompressing(false);
            console.error("🛡️ Arena Upload Error:", err);

            const errorMsg = err?.data?.message || "The Arena is busy or your connection dropped.";
            Alert.alert("Upload Error", errorMsg);
        }
    };

    if (!camPerm?.granted || !micPerm?.granted) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={60} color="#a349a4" />
                    <Text style={styles.title}>THE ARENA NEEDS ACCESS</Text>
                    <TouchableOpacity style={styles.submitButton} onPress={() => { requestCam(); requestMic(); }}>
                        <Text style={styles.buttonText}>GRANT ACCESS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
                        <Text style={{ color: '#666' }}>MAYBE LATER</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>
                {step === STEPS.RECORD && (
                    <CameraView style={styles.camera} ref={cameraRef} mode="video" facing={facing}>
                        <SafeAreaView style={styles.cameraOverlay}>
                            <View style={styles.navRow}>
                                <TouchableOpacity onPress={onClose} style={styles.iconCircle}>
                                    <Ionicons name="close" size={30} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} style={styles.iconCircle}>
                                    <Ionicons name="camera-reverse" size={30} color="white" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.recordContainer}>
                                <TouchableOpacity
                                    onLongPress={handleRecordPress}
                                    onPressOut={stopRecording}
                                    style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                                >
                                    <View style={styles.recordInner} />
                                </TouchableOpacity>
                                <Text style={styles.instruction}>{isRecording ? "RECORDING..." : "HOLD TO RECORD"}</Text>
                            </View>
                        </SafeAreaView>
                    </CameraView>
                )}

                {step === STEPS.FORM && (
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <VideoView player={player} style={styles.preview} contentFit="cover" />
                        <View style={styles.formBody}>
                            {mode !== 'rebuttal' ? (
                                <>
                                    <Text style={styles.label}>WHAT'S THE BEEF?</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Headline your case..."
                                        placeholderTextColor="#444"
                                        onChangeText={v => setForm({ ...form, title: v })}
                                    />
                                    <Text style={styles.label}>OPPONENT</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="@username"
                                        placeholderTextColor="#444"
                                        autoCapitalize="none"
                                        onChangeText={v => setForm({ ...form, opponent: v })}
                                    />
                                </>
                            ) : (
                                <View style={styles.rebuttalHeader}>
                                    <Text style={styles.rebuttalTitle}>REBUTTAL MODE</Text>
                                    <Text style={styles.rebuttalSub}>Speak your truth to the Arena.</Text>
                                </View>
                            )}
                            <TouchableOpacity style={styles.submitButton} onPress={handleFinish} disabled={isUploading}>
                                {isUploading ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <ActivityIndicator color="white" style={{ marginRight: 10 }} />
                                        <Text style={styles.buttonText}>
                                            {isCompressing ? "CRUNCHING VIDEO..." : "UPLOADING..."}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.buttonText}>UPLOAD TO ARENA</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStep(STEPS.RECORD)} style={styles.retryBtn}>
                                <Text style={styles.retryText}>RE-RECORD</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                )}

                {step === STEPS.SUCCESS && (
                    <View style={styles.successScreen}>
                        <Text style={styles.emoji}>{mode === 'rebuttal' ? "🔥" : "⚖️"}</Text>
                        <Text style={styles.title}>SUBMITTED</Text>
                        <TouchableOpacity style={styles.finalBtn} onPress={onClose}>
                            <Text style={styles.finalBtnText}>BACK TO BATTLE</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    permissionContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 40 },
    camera: { flex: 1 },
    cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 20 },
    navRow: { flexDirection: 'row', justifyContent: 'space-between' },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    recordContainer: { alignItems: 'center', marginBottom: 40 },
    recordBtn: { width: 84, height: 84, borderRadius: 42, borderWidth: 5, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
    recordBtnActive: { borderColor: '#a349a4' },
    recordInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#a349a4' },
    instruction: { color: 'white', fontWeight: '900', marginTop: 15, letterSpacing: 1 },
    preview: { width: '100%', height: '40%' },
    formBody: { padding: 25, flex: 1 },
    label: { color: '#a349a4', fontWeight: '900', fontSize: 11, marginBottom: 8, marginTop: 15, letterSpacing: 1 },
    input: { backgroundColor: '#111', color: 'white', padding: 16, borderRadius: 10, fontSize: 16 },
    submitButton: { backgroundColor: '#a349a4', padding: 20, borderRadius: 12, marginTop: 30, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: '900', fontSize: 16, fontStyle: 'italic' },
    retryBtn: { marginTop: 20, alignItems: 'center' },
    retryText: { color: '#666', fontWeight: 'bold', fontSize: 13 },
    rebuttalHeader: { alignItems: 'center', marginVertical: 30 },
    rebuttalTitle: { color: 'white', fontSize: 28, fontWeight: '900', fontStyle: 'italic' },
    rebuttalSub: { color: '#666', marginTop: 5 },
    successScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emoji: { fontSize: 80, marginBottom: 10 },
    title: { color: 'white', fontSize: 24, fontWeight: '900', fontStyle: 'italic', marginBottom: 30 },
    finalBtn: { backgroundColor: 'white', padding: 18, borderRadius: 12, width: '100%', alignItems: 'center' },
    finalBtnText: { color: 'black', fontWeight: '900' }
});