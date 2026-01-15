import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity, Modal,
    TextInput, Alert, ActivityIndicator, SafeAreaView
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Audio, Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useCreateStoryMutation, useHandleStoryRebuttalMutation } from "@/store/api/api";
import Toast from 'react-native-toast-message'

export default function CreateStoryModal({ visible, onClose, storyId = null, mode = 'new' }) {
    // --- PERMISSIONS & API ---
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [audioPermission, requestAudioPermission] = useMicrophonePermissions();
    const [createStory, { isLoading: isCreating }] = useCreateStoryMutation();
    const [handleRebuttal, { isLoading: isRebutting }] = useHandleStoryRebuttalMutation();

    // --- STATE MANAGEMENT ---
    const [step, setStep] = useState(1);
    const [facing, setFacing] = useState('back');
    const [isRecording, setIsRecording] = useState(false);
    const [videoUri, setVideoUri] = useState(null);
    const [title, setTitle] = useState('');
    const [opponent, setOpponent] = useState('');
    const [stake, setStake] = useState('Lunch');

    const cameraRef = useRef(null);
    const videoRef = useRef(null);
    const isLoading = isCreating || isRebutting;

    // 🛡️ 1. DEFINE FUNCTIONS FIRST (Staff Tip: Use useCallback)
    const resetFlow = useCallback(async () => {
        setStep(1);
        setVideoUri(null);
        setTitle('');
        setOpponent('');
        setStake('Lunch');
        setIsRecording(false);
        setFacing('back');

        try {
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        } catch (e) {
            console.log("Audio reset ignored");
        }
    }, []);

    // 🛡️ 2. THEN USE THEM IN EFFECTS
    useEffect(() => {
        if (!visible) {
            resetFlow();
        }
    }, [visible, resetFlow]);

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    // --- PERMISSIONS CHECK ---
    if (!cameraPermission || !audioPermission) return null;
    if (!cameraPermission.granted || !audioPermission.granted) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.permissionContainer}>
                    <Text style={styles.title}>ACCESS REQUIRED</Text>
                    <Text style={styles.subtext}>The Arena requires Camera & Audio to record your case.</Text>
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={async () => {
                            await requestCameraPermission();
                            await requestAudioPermission();
                        }}
                    >
                        <Text style={styles.buttonText}>GRANT PERMISSIONS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
                        <Text style={{ color: 'red', fontWeight: 'bold' }}>CANCEL</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    const startRecording = async () => {
        if (isRecording || !cameraRef.current) return;
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            setIsRecording(true);
            const video = await cameraRef.current.recordAsync({
                maxDuration: 60,
                quality: '480',
            });
            setVideoUri(video.uri);
            setStep(2);
        } catch (error) {
            setIsRecording(false);
            Alert.alert("Camera Error", "Recording failed.");
        }
    };

    const stopRecording = () => {
        if (cameraRef.current && isRecording) {
            cameraRef.current.stopRecording();
            setIsRecording(false);
        }
    };

    const handleFinish = async () => {
        if (!videoUri) return Alert.alert("Error", "No video recorded.");
        const formData = new FormData();
        formData.append('video', {
            uri: videoUri,
            name: mode === 'rebuttal' ? 'rebuttal.mp4' : 'challenge.mp4',
            type: 'video/mp4',
        });

        try {
            if (mode === 'rebuttal') {
                await handleRebuttal({ id: storyId, formData }).unwrap();
            } else {
                if (!title || !opponent) return Alert.alert("Missing Info", "Title and Opponent required.");
                formData.append('title', title);
                formData.append('opponentHandle', opponent);
                formData.append('wager', stake);
                formData.append('storyType', 'call-out');
                await createStory(formData).unwrap();
            }
            if (videoRef.current) await videoRef.current.unloadAsync();
            Toast.show({
                type: 'success',
                text1: mode === 'rebuttal' ? 'Rebuttal sent successfully' : 'Story sent successfully'
            });
            setStep(3);
        } catch (err) {
            Alert.alert("Upload Failed", "Error uploading beef.");
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>
                {step === 1 && (
                    <CameraView style={styles.camera} ref={cameraRef} mode="video" facing={facing}>
                        <SafeAreaView style={styles.overlay}>
                            <View style={styles.headerRow}>
                                <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                                    <Text style={styles.cancelText}>CANCEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={toggleCameraFacing} style={styles.flipBtn}>
                                    <Ionicons name="camera-reverse-outline" size={30} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.cameraHeader}>{mode === 'rebuttal' ? "THE REBUTTAL" : "STATE YOUR CASE"}</Text>
                            <View style={styles.bottomControls}>
                                <TouchableOpacity
                                    style={[styles.recordButton, isRecording && styles.recordingActive]}
                                    onLongPress={startRecording}
                                    onPressOut={stopRecording}
                                    delayLongPress={150}
                                >
                                    <View style={styles.innerRecordCircle} />
                                </TouchableOpacity>
                                <Text style={styles.instruction}>{isRecording ? "RECORDING..." : "HOLD TO RECORD"}</Text>
                            </View>
                        </SafeAreaView>
                    </CameraView>
                )}

                {step === 2 && (
                    <View style={styles.formContainer}>
                        <Video ref={videoRef} style={styles.previewVideo} source={{ uri: videoUri }} useNativeControls resizeMode={ResizeMode.COVER} isLooping shouldPlay />
                        <View style={styles.inputSection}>
                            {mode === 'rebuttal' ? (
                                <View style={styles.rebuttalInfo}>
                                    <Text style={styles.rebuttalTitle}>READY TO FIRE BACK?</Text>
                                    <Text style={styles.subtext}>This completes the beef.</Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.label}>THE BEEF</Text>
                                    <TextInput style={styles.input} placeholder="What happened?" placeholderTextColor="#666" value={title} onChangeText={setTitle} />
                                    <Text style={styles.label}>OPPONENT HANDLE</Text>
                                    <TextInput style={styles.input} placeholder="@username" placeholderTextColor="#666" value={opponent} onChangeText={setOpponent} autoCapitalize="none" />
                                    <Text style={styles.label}>STAKES</Text>
                                    <View style={styles.chipContainer}>
                                        {['Lunch', 'Apology', '$20'].map(s => (
                                            <TouchableOpacity key={s} style={[styles.chip, stake === s && styles.activeChip]} onPress={() => setStake(s)}>
                                                <Text style={[styles.chipText, stake === s && { color: 'white' }]}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}
                            <TouchableOpacity style={[styles.submitButton, mode === 'rebuttal' && { backgroundColor: '#FF3B30' }]} onPress={handleFinish} disabled={isLoading}>
                                {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{mode === 'rebuttal' ? "SEND REBUTTAL" : "ISSUE CHALLENGE"}</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStep(1)} style={{ marginTop: 20 }}>
                                <Text style={styles.reRecordText}>RE-RECORD</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {step === 3 && (
                    <View style={styles.successContainer}>
                        <Text style={styles.giantEmoji}>{mode === 'rebuttal' ? "🔥" : "⚖️"}</Text>
                        <Text style={styles.successHeader}>{mode === 'rebuttal' ? "REBUTTAL SENT" : "CASE FILED"}</Text>
                        <Text style={styles.successSubtext}>{mode === 'rebuttal' ? "The arena awaits the verdict." : `Your challenge to ${opponent} is live.`}</Text>
                        <TouchableOpacity style={styles.finalButton} onPress={onClose}>
                            <Text style={styles.buttonText}>RETURN TO ARENA</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#000' },
    title: { fontSize: 28, fontWeight: '900', color: '#fff', fontStyle: 'italic', marginBottom: 10 },
    camera: { flex: 1 },
    overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, paddingTop: 10 },
    flipBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 25 },
    cameraHeader: { color: 'white', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
    bottomControls: { alignItems: 'center', marginBottom: 40 },
    recordButton: { width: 90, height: 90, borderRadius: 45, borderWidth: 6, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
    recordingActive: { borderColor: '#a349a4', transform: [{ scale: 1.1 }] },
    innerRecordCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#a349a4' },
    instruction: { color: 'white', marginTop: 15, fontWeight: '900', letterSpacing: 1 },
    backBtn: { padding: 10 },
    cancelText: { color: 'white', fontWeight: '900', fontSize: 14 },
    formContainer: { flex: 1, backgroundColor: '#000' },
    previewVideo: { width: '100%', height: '40%' },
    inputSection: { padding: 25 },
    label: { fontSize: 12, fontWeight: '900', color: '#a349a4', marginBottom: 8, marginTop: 15, letterSpacing: 1 },
    input: { backgroundColor: '#111', color: '#fff', padding: 15, borderRadius: 10, fontSize: 16 },
    chipContainer: { flexDirection: 'row', gap: 10, marginBottom: 20, marginTop: 10 },
    chip: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#111', borderRadius: 20, borderWidth: 1, borderColor: '#333' },
    activeChip: { backgroundColor: '#a349a4', borderColor: '#a349a4' },
    chipText: { color: '#666', fontWeight: 'bold' },
    submitButton: { backgroundColor: '#a349a4', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonText: { color: 'white', fontWeight: '900', fontSize: 16, fontStyle: 'italic' },
    reRecordText: { textAlign: 'center', color: '#666', fontWeight: 'bold', fontSize: 12 },
    rebuttalInfo: { alignItems: 'center', marginVertical: 40 },
    rebuttalTitle: { fontSize: 24, fontWeight: '900', color: '#fff', fontStyle: 'italic' },
    successContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 40 },
    giantEmoji: { fontSize: 80, marginBottom: 20 },
    successHeader: { fontSize: 28, fontWeight: '900', color: '#fff', fontStyle: 'italic' },
    successSubtext: { textAlign: 'center', color: '#666', marginVertical: 20, fontSize: 16 },
    subtext: { textAlign: 'center', color: '#666', marginTop: 10 },
    finalButton: { backgroundColor: '#fff', padding: 18, borderRadius: 12, width: '100%', alignItems: 'center' },
});