import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from "@react-navigation/native";
import { useVideoPlayer, VideoView } from 'expo-video';

// 🛡️ API & PROVIDER
import {
    useUpdateStoryStatusMutation,
    useAcceptChallengeMutation,
    useGetStoryByIdQuery
} from "@/store/api/api";
import { useVideoValet } from "../../Components/VideoProvider";

// 🛡️ MODALS
import CreateStoryModal from '../../Modals/CreateStoryModal';

export const ChallengeDetailsScreen = ({ route, navigation }) => {
    const { story: initialStory } = route.params;
    const isFocused = useIsFocused();

    // 🛡️ 1. Fetch live data
    const { data: liveStory } = useGetStoryByIdQuery(initialStory.id);
    const story = liveStory || initialStory;

    // 🛡️ 2. FIX: Define the missing state
    const [isCameraVisible, setIsCameraVisible] = useState(false);

    // 🛡️ 3. Setup Mutations
    const [updateStoryStatus] = useUpdateStoryStatusMutation();
    const [acceptChallenge, { isLoading: isAccepting }] = useAcceptChallengeMutation();

    const { setActivePlayerId } = useVideoValet();

    // 🛡️ 4. Initialize Player directly (Bypassing the currently empty Valet getPlayer)
    const player = useVideoPlayer(story.sideAVideoUrl, (p) => {
        p.loop = true;
        p.muted = false;
        p.play();
    });

    // 🛡️ 5. Handle Playback on Focus
    useEffect(() => {
        if (isFocused) {
            setActivePlayerId(story.id.toString());
            player.play();
        } else {
            player.pause();
        }
    }, [isFocused, player, story.id]);

    // 🛡️ 6. Receipt Update Logic
    useEffect(() => {
        if (isFocused && !story.sideBViewedAt) {
            updateStoryStatus({
                id: story.id,
                sideBAcknowledged: true,
                sideBViewedAt: new Date().toISOString()
            });
        }
    }, [isFocused, story.id, story.sideBViewedAt]);

    const handleAccept = async () => {
        try {
            await acceptChallenge(story.id).unwrap();
            Alert.alert("It's ON!", "Challenge accepted.");
        } catch (err) {
            Alert.alert("Error", "Could not accept challenge.");
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={30} color="white" />
            </TouchableOpacity>

            <View style={styles.videoWrapper}>
                <VideoView
                    player={player}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    nativeViewType="textureView" // 🛡️ S8 Stability Fix
                    allowsFullscreen={false}
                    showsPlaybackControls={true}
                />
            </View>

            <SafeAreaView style={styles.content}>
                <Text style={styles.challengerLabel}>
                    CHALLENGE FROM @{story.SideA?.username || 'User'}
                </Text>
                <Text style={styles.title}>{story.title}</Text>

                <View style={styles.wagerBadge}>
                    <Ionicons name="flash" size={16} color="#FFD700" />
                    <Text style={styles.wagerText}>STAKE: {story.wager?.toUpperCase()}</Text>
                </View>

                <Text style={styles.description}>
                    {story.sideAContent || "No additional details provided."}
                </Text>
            </SafeAreaView>

            <View style={styles.footer}>
                {story.status === 'pending-acceptance' ? (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#5856D6' }]}
                        onPress={handleAccept}
                        disabled={isAccepting}
                    >
                        {isAccepting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ACCEPT CHALLENGE</Text>}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#a349a4' }]}
                        onPress={() => setIsCameraVisible(true)}
                    >
                        <Text style={styles.buttonText}>RECORD REBUTTAL</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 🛡️ Now 'isCameraVisible' and 'setIsCameraVisible' are defined! */}
            <CreateStoryModal
                visible={isCameraVisible}
                onClose={() => setIsCameraVisible(false)}
                mode="rebuttal"
                storyId={story.id}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 5 },
    videoWrapper: { width: '100%', height: '55%', backgroundColor: '#111' },
    content: { padding: 20 },
    challengerLabel: { color: '#a349a4', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    title: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 5 },
    wagerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, marginTop: 10 },
    wagerText: { color: '#FFD700', fontWeight: 'bold', marginLeft: 5 },
    description: { color: '#aaa', marginTop: 15, fontSize: 16, lineHeight: 22 },
    footer: { position: 'absolute', bottom: 40, width: '100%', paddingHorizontal: 20 },
    actionButton: { height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});