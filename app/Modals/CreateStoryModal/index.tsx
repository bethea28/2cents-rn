import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity, Modal,
    TextInput, Alert, ActivityIndicator
} from 'react-native';
// Core Expo hardware modules
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import { Platform } from 'react-native';
import * as Device from 'expo-device'; // You might need to: npx expo install expo-device
import { useCreateStoryMutation } from "@/store/api/api";

export default function CreateStoryModal({ visible, onClose }) {
    // --- STATE MANAGEMENT ---
    const [permission, requestPermission] = useCameraPermissions();
    const [step, setStep] = useState(1); // 1: Record, 2: Preview/Details, 3: Success
    const [isRecording, setIsRecording] = useState(false);
    const [videoUri, setVideoUri] = useState(null);
    const [opponent, setOpponent] = useState('');
    const [stake, setStake] = useState('Loser buys lunch');
    const [createStory] = useCreateStoryMutation();
    const cameraRef = useRef(null);

    // --- PERMISSIONS CHECK ---
    if (!permission) return <View />; // Loading state

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.permissionContainer}>
                    <Text style={styles.text}>We need camera access to start the beef.</Text>
                    <TouchableOpacity style={styles.submitButton} onPress={requestPermission}>
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
                        <Text style={{ color: 'red' }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    // --- ACTIONS ---
    // const startRecording = async () => {
    //     if (cameraRef.current) {
    //         try {
    //             setIsRecording(true);
    //             const video = await cameraRef.current.recordAsync({
    //                 maxDuration: 60, // 60 second limit for MVP
    //             });
    //             setVideoUri(video.uri);
    //             setStep(2);
    //         } catch (error) {
    //             console.error("Recording failed", error);
    //             setIsRecording(false);
    //         }
    //     }
    // };
    const startRecording = async () => { // bypass recording testing
        console.log('--- STARTING RECORDING PROCESS ---');

        // FORCE BYPASS if we are on a simulator OR if the hardware isn't available
        const isSimulator = !Device.isDevice;

        if (isSimulator) {
            console.log("BYPASS ACTIVE: Running on Simulator");
            const mockVideoUri = "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4";
            setVideoUri(mockVideoUri);
            setStep(2);
            return;
        }

        // REAL PHONE LOGIC
        try {
            console.log('Attempting real recording on device...');
            setIsRecording(true);
            const video = await cameraRef.current.recordAsync();
            setVideoUri(video.uri);
            setStep(2);
        } catch (error) {
            console.error("Hardware Recording failed", error);
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (cameraRef.current && isRecording) {
            cameraRef.current.stopRecording();
            setIsRecording(false);
        }
    };


    const handleFinish = async () => {
        // 1. Create the FormData "Envelope"
        const data = new FormData();

        // 2. Append the video file (the most important part)
        data.append('sideAVideo', {
            uri: videoUri,
            name: 'callout_video.mp4',
            type: 'video/mp4',
        });

        // 3. Append the text details
        data.append('sideAAuthorId', 1234);
        data.append('opponentHandle', opponent); // Side B
        data.append('stake', stake);
        data.append('storyType', 'callout');

        console.log('test me now', data._parts[0])
        // return
        // 4. Trigger the mutation
        try {
            await createStory(data).unwrap();
            setStep(3); // Success!
        } catch (err) {
            console.error("Upload failed", err);
        }
    };

    const resetFlow = () => {
        setStep(1);
        setVideoUri(null);
        setOpponent('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>

                {/* STEP 1: THE CAMERA RANT */}
                {step === 1 && (
                    <CameraView style={styles.camera} ref={cameraRef} mode="video">
                        <View style={styles.overlay}>
                            <Text style={styles.cameraHeader}>State Your Case</Text>

                            <TouchableOpacity
                                style={[styles.recordButton, isRecording && styles.recordingActive]}
                                onLongPress={startRecording}
                                onPressOut={stopRecording}
                            >
                                <View style={styles.innerRecordCircle} />
                            </TouchableOpacity>
                            <Text style={styles.instruction}>Hold to Record</Text>

                            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
                            </TouchableOpacity>
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
                            <Text style={styles.label}>Who are you calling out?</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="@username or phone"
                                value={opponent}
                                onChangeText={setOpponent}
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

                            <TouchableOpacity style={styles.submitButton} onPress={handleFinish}>
                                <Text style={styles.buttonText}>ISSUE CHALLENGE</Text>
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
                        <Text style={styles.giantEmoji}>⚖️</Text>
                        <Text style={styles.header}>Case Filed!</Text>
                        <Text style={styles.subtext}>Send the link to {opponent} so they can respond.</Text>

                        <View style={styles.linkCard}>
                            <Text style={styles.linkText}>2cents.app/invite/x82J9</Text>
                        </View>

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
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    camera: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 },
    cameraHeader: { position: 'absolute', top: 60, color: 'white', fontSize: 24, fontWeight: 'bold' },
    recordButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 5, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
    recordingActive: { borderColor: 'red' },
    innerRecordCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'red' },
    instruction: { color: 'white', marginTop: 10, fontWeight: '500' },
    backBtn: { position: 'absolute', top: 60, left: 20 },

    formContainer: { flex: 1, backgroundColor: '#fff' },
    previewVideo: { width: '100%', height: '40%' },
    inputSection: { padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, fontSize: 16 },
    chipContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    chip: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 20, minWidth: 80, alignItems: 'center' },
    activeChip: { backgroundColor: '#8a2be2' },
    submitButton: { backgroundColor: '#8a2be2', padding: 18, borderRadius: 15, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    successContainer: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 30 },
    giantEmoji: { fontSize: 80, marginBottom: 20 },
    header: { fontSize: 28, fontWeight: 'bold' },
    subtext: { textAlign: 'center', color: '#666', marginVertical: 20 },
    linkCard: { backgroundColor: '#f8f8f8', padding: 20, borderRadius: 10, width: '100%', borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
    linkText: { color: '#8a2be2', fontWeight: 'bold' },
    finalButton: { backgroundColor: '#000', padding: 18, borderRadius: 15, width: '100%', alignItems: 'center', marginTop: 30 },
});