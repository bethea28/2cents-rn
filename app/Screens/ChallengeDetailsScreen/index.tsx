import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

export const ChallengeDetailsScreen = ({ route, navigation }) => {
    const { story } = route.params;
    const [status, setStatus] = useState({});

    return (
        <View style={styles.container}>
            {/* BACK BUTTON */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="chevron-back" size={30} color="white" />
            </TouchableOpacity>

            {/* VIDEO SECTION */}
            <View style={styles.videoWrapper}>
                <Video
                    source={{ uri: story.sideAVideoUrl }}
                    style={styles.video}
                    resizeMode="cover"
                    useNativeControls
                    onPlaybackStatusUpdate={status => setStatus(() => status)}
                />
                {!status.isLoaded && (
                    <ActivityIndicator size="large" color="#FF3B30" style={styles.loader} />
                )}
            </View>

            {/* BEEF DETAILS */}
            <View style={styles.content}>
                <Text style={styles.challengerLabel}>
                    CHALLENGE FROM @{story.SideA?.username || 'User'}
                </Text>
                <Text style={styles.title}>{story.title}</Text>

                <View style={styles.wagerBadge}>
                    <Ionicons name="flash" size={16} color="#FFD700" />
                    <Text style={styles.wagerText}>STAKE: {story.wager}</Text>
                </View>

                <Text style={styles.description}>
                    {story.sideAContent || "No additional details provided."}
                </Text>
            </View>

            {/* ACTION FOOTER */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.rebuttalButton}
                    onPress={() => navigation.navigate('Camera', {
                        storyId: story.id,
                        mode: 'rebuttal'
                    })}
                >
                    <Text style={styles.buttonText}>RECORD REBUTTAL</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    videoWrapper: { width: '100%', height: '55%', justifyContent: 'center' },
    video: { flex: 1 },
    loader: { position: 'absolute', alignSelf: 'center' },
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
    rebuttalButton: {
        backgroundColor: '#FF3B30',
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});
