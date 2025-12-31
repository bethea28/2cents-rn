import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 🛠 Added useGetStoryByIdQuery for live updates
import { useUpdateStoryStatusMutation, useAcceptChallengeMutation, useGetStoryByIdQuery } from "@/store/api/api";
import CreateStoryModal from '../../Modals/CreateStoryModal';
import { VideoPlayerPlayback } from '../../Components/VideoPlayerPlayback';

export const ChallengeDetailsScreen = ({ route, navigation }) => {
    const { story: initialStory } = route.params;

    // 🛠 ENGINEER: Fetch live data. 'liveStory' will update automatically when mutation finishes.
    const { data: liveStory } = useGetStoryByIdQuery(initialStory.id);

    // Fallback to initialStory if live data hasn't arrived yet
    const story = liveStory || initialStory;

    const [isCameraVisible, setIsCameraVisible] = useState(false);

    // Mutations
    const [updateStory] = useUpdateStoryStatusMutation();
    const [acceptChallenge, { isLoading: isAccepting }] = useAcceptChallengeMutation();

    // 🛠 ENGINEER: This check is now "Watching" liveStory.status
    const isAwaitingAcceptance = story.status === 'pending-acceptance';

    const handleAccept = async () => {
        try {
            // Once this succeeds, RTK Query invalidates the cache and liveStory updates
            await acceptChallenge(story.id).unwrap();
            Alert.alert("It's ON!", "Challenge accepted. You have 24 hours to respond.");
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
                <VideoPlayerPlayback
                    videoSource={story.sideAVideoUrl}
                    style={styles.video}
                    isMuted={false}
                    showControls={true}
                    onLoad={() => {
                        // Only trigger if we haven't recorded a view time yet
                        if (!story.sideBViewedAt) {
                            console.log('upating story receipt gzarza', story)
                            updateStory({
                                id: story.id,
                                sideBAcknowledged: true,
                                sideBViewedAt: new Date().toISOString()
                            });
                            console.log("DB Update Sent: User is watching the beef.");
                        }
                    }}
                />
            </View>

            <View style={styles.content}>
                <Text style={styles.challengerLabel}>CHALLENGE FROM @{story.SideA?.username}</Text>
                <Text style={styles.title}>{story.title}</Text>
                <View style={styles.wagerBadge}>
                    <Ionicons name="flash" size={16} color="#FFD700" />
                    <Text style={styles.wagerText}>STAKE: {story.wager}</Text>
                </View>
                <Text style={styles.description}>{story.sideAContent || "No additional details provided."}</Text>
            </View>

            <View style={styles.footer}>
                {isAwaitingAcceptance ? (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#5856D6' }]}
                        onPress={handleAccept}
                        disabled={isAccepting}
                    >
                        {isAccepting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ACCEPT CHALLENGE</Text>}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                        onPress={() => setIsCameraVisible(true)}
                    >
                        <Text style={styles.buttonText}>RECORD REBUTTAL</Text>
                    </TouchableOpacity>
                )}
            </View>

            <CreateStoryModal
                visible={isCameraVisible}
                onClose={() => setIsCameraVisible(false)}
                mode="rebuttal"
                storyId={story.id}
            />
        </View>
    );
};
// ... (Styles remain the same)

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    videoWrapper: { width: '100%', height: '55%', backgroundColor: '#111' }, // Added BG color for loading
    video: { flex: 1 },
    content: { padding: 20 },
    challengerLabel: { color: '#FF3B30', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    title: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 5 },
    wagerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginTop: 10
    },
    wagerText: { color: '#FFD700', fontWeight: 'bold', marginLeft: 5 },
    description: { color: '#aaa', marginTop: 15, fontSize: 16, lineHeight: 22 },
    footer: { position: 'absolute', bottom: 40, width: '100%', paddingHorizontal: 20 },
    actionButton: {
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});