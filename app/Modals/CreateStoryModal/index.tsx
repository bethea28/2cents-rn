import React, { useState, useRef } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity, Modal,
    TextInput, Alert, ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as Device from 'expo-device';
import { useCreateStoryMutation, useUpdateStoryStatusMutation, useHandleStoryRebuttalMutation } from "@/store/api/api";

export default function CreateStoryModal({ visible, onClose, storyId = null, mode = 'new' }) {
    // --- PERMISSIONS & API ---
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [audioPermission, requestAudioPermission] = useMicrophonePermissions();

    const [createStory, { isLoading: isCreating }] = useCreateStoryMutation();
    const [updateStory, { isLoading: isUpdating }] = useUpdateStoryStatusMutation();
    const [handleRebuttal] = useHandleStoryRebuttalMutation();

    // --- STATE MANAGEMENT ---
    const [step, setStep] = useState(1); // 1: Record, 2: Details, 3: Success
    const [isRecording, setIsRecording] = useState(false);
    const [videoUri, setVideoUri] = useState(null);
    const [title, setTitle] = useState('');
    const [opponent, setOpponent] = useState('');
    const [stake, setStake] = useState('Lunch');
    const cameraRef = useRef(null);

    const isLoading = isCreating || isUpdating;

    // --- PERMISSIONS UI ---
    if (!cameraPermission || !audioPermission) {
        return <View style={styles.container} />;
    }

    if (!cameraPermission.granted || !audioPermission.granted) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.permissionContainer}>
                    <Text style={styles.title}>Camera & Audio Needed</Text>
                    <Text style={styles.subtext}>We need both to record your challenge.</Text>
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={async () => {
                            await requestCameraPermission();
                            await requestAudioPermission();
                        }}
                    >
                        <Text style={styles.buttonText}>Grant Permissions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
                        <Text style={{ color: 'red' }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    // --- RECORDING LOGIC ---
    const startRecording = async () => {
        if (isRecording || !cameraRef.current) return;

        if (!Device.isDevice) {
            console.log("BYPASS: Running on Simulator");
            setVideoUri("https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4");
            setStep(2);
            return;
        }

        try {
            setIsRecording(true);
            const video = await cameraRef.current.recordAsync({
                maxDuration: 60,
                quality: '720p',
            });
            setVideoUri(video.uri);
            // setVideoUri("https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4");

            setStep(2);
        } catch (error) {
            console.error("Recording failed", error);
            setIsRecording(false);
            Alert.alert("Error", "Could not start recording.");
        }
    };

    const stopRecording = async () => {
        if (cameraRef.current && isRecording) {
            try {
                cameraRef.current.stopRecording();
                setIsRecording(false);
            } catch (e) {
                console.error("Stop recording error", e);
            }
        }
    };

    // --- UPLOAD LOGIC ---
    const handleFinish = async () => {
        const formData = new FormData();

        if (mode === 'rebuttal') {
            // REBUTTAL FLOW
            console.log('gza rebuttal', videoUri)
            formData.append('video', {
                uri: videoUri,
                // uri: 'https://firebasestorage.googleapis.com/v0/b/cents-fe1c4.firebasestorage.app/o/videos%2Ftest-vid.mp4?alt=media&token=429f748c-c13e-4ebf-8878-3fb24cd4879a',
                name: 'rebuttal.mp4',
                type: 'video/mp4',
            });
            formData.append('status', 'complete');
            formData.append('sideBAcknowledged', 'true');
            console.log('SENDING DATA FORM', formData._parts)
            try {
                await handleRebuttal({ id: storyId, formData }).unwrap();
                setStep(3);
            } catch (err) {
                console.log('ERROR TOO', err.data)
                Alert.alert("Rebuttal Failed", err.data?.error || "Could not post response.");
            }
        } else {
            // NEW CHALLENGE FLOW
            if (!title || !opponent) {
                Alert.alert("Missing Info", "Please provide a title and an opponent.");
                return;
            }

            formData.append('video', {
                uri: videoUri,
                name: 'challenge.mp4',
                type: 'video/mp4',
            });
            formData.append('title', title);
            formData.append('opponentHandle', opponent);
            formData.append('stake', stake);
            formData.append('storyType', 'call-out');

            try {
                await createStory(formData).unwrap();
                setStep(3);
            } catch (err) {
                Alert.alert("Challenge Failed", err.data?.error || "Upload failed.");
            }
        }
    };

    const resetFlow = () => {
        setStep(1);
        setVideoUri(null);
        setTitle('');
        setOpponent('');
        setStake('Lunch');
        setIsRecording(false);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>

                {/* STEP 1: RECORDING */}
                {step === 1 && (
                    <CameraView style={styles.camera} ref={cameraRef} mode="video">
                        <View style={styles.overlay}>
                            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={styles.cameraHeader}>
                                {mode === 'rebuttal' ? "Your Rebuttal" : "State Your Case"}
                            </Text>
                            <TouchableOpacity
                                style={[styles.recordButton, isRecording && styles.recordingActive]}
                                onLongPress={startRecording}
                                onPressOut={stopRecording}
                                delayLongPress={150}
                            >
                                <View style={styles.innerRecordCircle} />
                            </TouchableOpacity>
                            <Text style={styles.instruction}>
                                {isRecording ? "RECORDING..." : "HOLD TO RECORD"}
                            </Text>
                        </View>
                    </CameraView>
                )}

                {/* STEP 2: PREVIEW & DETAILS */}
                {step === 2 && (
                    <View style={styles.formContainer}>
                        <Video
                            style={styles.previewVideo}
                            source={{ uri: videoUri }}
                            useNativeControls
                            resizeMode={ResizeMode.COVER}
                            isLooping
                            shouldPlay
                        />

                        <View style={styles.inputSection}>
                            {mode === 'rebuttal' ? (
                                <View style={styles.rebuttalInfo}>
                                    <Text style={styles.rebuttalTitle}>Ready to Fire Back?</Text>
                                    <Text style={styles.subtext}>This will complete the beef and notify the challenger.</Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.label}>What's the Beef?</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Someone stole my lunch"
                                        value={title}
                                        onChangeText={setTitle}
                                    />
                                    <Text style={styles.label}>Who are you calling out?</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="@username"
                                        value={opponent}
                                        onChangeText={setOpponent}
                                        autoCapitalize="none"
                                    />
                                    <Text style={styles.label}>What are the stakes?</Text>
                                    <View style={styles.chipContainer}>
                                        {['Lunch', 'Apology', '$20'].map(s => (
                                            <TouchableOpacity
                                                key={s}
                                                style={[styles.chip, stake === s && styles.activeChip]}
                                                onPress={() => setStake(s)}
                                            >
                                                <Text style={stake === s ? { color: 'white' } : {}}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            <TouchableOpacity
                                style={[styles.submitButton, mode === 'rebuttal' && { backgroundColor: '#FF3B30' }]}
                                onPress={handleFinish}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        {mode === 'rebuttal' ? "SEND REBUTTAL" : "ISSUE CHALLENGE"}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setStep(1)} style={{ marginTop: 15 }}>
                                <Text style={{ textAlign: 'center', color: '#666' }}>Re-record</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* STEP 3: SUCCESS */}
                {step === 3 && (
                    <View style={styles.successContainer}>
                        <Text style={styles.giantEmoji}>{mode === 'rebuttal' ? "🔥" : "⚖️"}</Text>
                        <Text style={styles.header}>{mode === 'rebuttal' ? "Rebuttal Sent!" : "Case Filed!"}</Text>
                        <Text style={styles.subtext}>
                            {mode === 'rebuttal' ? "The beef is now complete." : `Challenge sent to ${opponent}.`}
                        </Text>
                        <TouchableOpacity style={styles.finalButton} onPress={resetFlow}>
                            <Text style={styles.buttonText}>Back to Feed</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    camera: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 },
    cameraHeader: { position: 'absolute', top: 60, color: 'white', fontSize: 24, fontWeight: 'bold' },
    recordButton: { width: 90, height: 90, borderRadius: 45, borderWidth: 6, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
    recordingActive: { borderColor: 'red', transform: [{ scale: 1.1 }] },
    innerRecordCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'red' },
    instruction: { color: 'white', marginTop: 15, fontWeight: 'bold', letterSpacing: 1 },
    backBtn: { position: 'absolute', top: 60, left: 20, padding: 10 },
    formContainer: { flex: 1, backgroundColor: '#fff' },
    previewVideo: { width: '100%', height: '45%' },
    inputSection: { padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 12, fontSize: 16 },
    chipContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    chip: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#f0f0f0', borderRadius: 20 },
    activeChip: { backgroundColor: '#8a2be2' },
    submitButton: { backgroundColor: '#8a2be2', padding: 18, borderRadius: 15, alignItems: 'center', minHeight: 60, justifyContent: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    rebuttalInfo: { alignItems: 'center', marginVertical: 40 },
    rebuttalTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    successContainer: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 30 },
    giantEmoji: { fontSize: 80, marginBottom: 20 },
    header: { fontSize: 28, fontWeight: 'bold' },
    subtext: { textAlign: 'center', color: '#666', marginVertical: 20, fontSize: 16 },
    finalButton: { backgroundColor: '#000', padding: 18, borderRadius: 15, width: '100%', alignItems: 'center' },
});