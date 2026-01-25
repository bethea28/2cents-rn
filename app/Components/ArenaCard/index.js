import * as React from "react";
import {
    View, Text, Pressable, Image, StyleSheet
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

// 🛡️ IMPORT CHECK: Ensure these match your file structure!
// We use Named Imports (with curly braces) because that's how we exported them.



import { ArenaVideo } from '../ArenaVideo';

/**
 * 🛡️ THE ARENA CARD
 * Optimized for the "Continuous Camera Move"
 */

export const ArenaCard = React.memo(({ item, isActive, isAppMuted }) => {
    // 🛡️ Only provide the URL if the card is active. 
    // When isActive becomes false, expo-video drops the internal network buffer.
    const navigation = useNavigation();
    const player = useVideoPlayer(isActive ? item.sideAVideoUrl : null, (p) => {
        p.loop = true;
        p.muted = isAppMuted;
    });

    React.useEffect(() => {
        if (!player || typeof player !== 'object') return;

        if (isActive) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, player]);


    // 🛡️ 3. SYNC MUTE STATE
    React.useEffect(() => {
        if (player) {
            player.muted = isAppMuted;
        }
    }, [isAppMuted, player]);

    // 🛡️ The Player Engine and other logic...

    const handleEnterArena = () => {
        // 3. Now navigation is in scope
        if (navigation) {
            navigation.navigate("FullStoryScreen", {
                storyId: item.id,
                initialData: item
            });
        } else {
            console.error("Navigation object is missing!");
        }
    };


    return (
        <View style={styles.card}>
            {/* --- HEADER (75px) --- */}
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>LIVE ARENA</Text>
                    </View>
                </View>
                <View style={styles.stakeContainer}>
                    <Text style={styles.stakeLabel}>WAGER</Text>
                    <Text style={styles.stakeValue}>{item.wager || '0'}</Text>
                </View>
            </View>

            {/* --- ARENA (500px) --- */}
            <Pressable onPress={handleEnterArena} style={styles.versusArena}>
                {/* 🛡️ POSTER LAYER (Always there as a fallback) */}
                <Image
                    source={{ uri: item.SideA?.profilePic || item.sideAVideoUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />

                {/* 🛡️ REFACTORED VIDEO LAYER */}
                <ArenaVideo
                    player={player}
                    isActive={isActive}
                    dimmed={false}
                />

                {/* SIDE B TEASER */}
                <View style={styles.rebuttalTeaser} pointerEvents="none">
                    <Image
                        source={{ uri: item.sideBThumbnailUrl || item.sideBVideoUrl }}
                        style={styles.teaserAvatar}
                    />
                    <View style={styles.teaserTextContainer}>
                        <Text style={styles.teaserAction}>WATCH REBUTTAL</Text>
                        <Text style={styles.teaserUser}>@{item.sideBUsername}</Text>
                    </View>
                    <View style={styles.goCircle}>
                        <Ionicons name="play" size={14} color="white" />
                    </View>
                </View>

                {/* SIDE A LABEL */}
                <View style={styles.userALabel}>
                    <Text style={styles.labelText}>@{item.sideAUsername}</Text>
                </View>
            </Pressable>

            {/* --- FOOTER (50px) --- */}
            <Pressable onPress={handleEnterArena} style={styles.cardFooter}>
                <Text style={styles.footerCTA}>ENTER ARENA TO VOTE →</Text>
            </Pressable>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#0A0A0A",
        marginHorizontal: 12,
        marginBottom: 25,
        borderRadius: 28,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: '#1A1A1A'
    },
    cardHeader: {
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 75
    },
    title: { color: "#FFF", fontSize: 18, fontWeight: "800" },
    typeBadge: {
        backgroundColor: "#a349a422",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 5,
        alignSelf: 'flex-start'
    },
    typeText: { color: "#d67bff", fontSize: 10, fontWeight: "bold" },
    stakeContainer: { alignItems: 'flex-end' },
    stakeLabel: { color: '#666', fontSize: 8, fontWeight: 'bold' },
    stakeValue: { color: "#FFD700", fontSize: 22, fontWeight: "900" },

    versusArena: {
        height: 500,
        width: '100%',
        backgroundColor: '#050505',
        position: 'relative'
    },
    rebuttalTeaser: {
        position: 'absolute', bottom: 16, right: 12, left: 12,
        backgroundColor: 'rgba(163, 73, 164, 0.95)', flexDirection: 'row',
        alignItems: 'center', padding: 10, borderRadius: 18,
        borderWidth: 1.5, borderColor: '#FFF', elevation: 8, zIndex: 20,
    },
    teaserAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#FFF' },
    teaserTextContainer: { flex: 1, marginLeft: 12 },
    teaserAction: { color: 'white', fontSize: 10, fontWeight: '900' },
    teaserUser: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    goCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },

    userALabel: {
        position: 'absolute',
        top: 15,
        left: 15,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    labelText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

    cardFooter: {
        padding: 15,
        backgroundColor: "#111",
        height: 50,
        justifyContent: 'center',
        alignItems: 'center'
    },
    footerCTA: { color: "#a349a4", fontSize: 12, fontWeight: "900" }
});