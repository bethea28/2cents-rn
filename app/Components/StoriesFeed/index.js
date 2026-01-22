import * as React from "react";
import {
    View, StyleSheet, Text, FlatList, ActivityIndicator,
    SafeAreaView, Pressable, Image, Dimensions
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Video, ResizeMode } from 'expo-av';
import { useGetAllCompleteStoriesQuery } from "@/store/api/api";
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const VIEW_CONFIG = { itemVisiblePercentThreshold: 50, minimumViewTime: 100 };

const ArenaCard = React.memo(({ item, isActive, isAppMuted }) => {
    const navigation = useNavigation();
    const [status, setStatus] = React.useState({});

    const handlePressRebuttal = () => {
        navigation.navigate("FullStoryScreen", { storyId: item.id, initialSide: 'B' });
    };

    const handlePressMain = () => {
        navigation.navigate("StoryDetail", { storyId: item.id, initialSide: 'A' });
    };

    return (
        <View style={styles.card}>
            {/* 🛡️ Header Area */}
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

            <View style={styles.versusArena}>
                {/* 🛡️ WORKING VIDEO ENGINE (UNTOUCHED) */}
                <Pressable onPress={handlePressMain} style={StyleSheet.absoluteFill}>
                    {isActive ? (
                        <Video
                            source={{ uri: item.sideAVideoUrl }}
                            style={StyleSheet.absoluteFill}
                            resizeMode={ResizeMode.COVER}
                            isLooping
                            shouldPlay={true}
                            isMuted={isAppMuted}
                            onPlaybackStatusUpdate={s => setStatus(() => s)}
                            progressUpdateIntervalMillis={1000}
                            bufferConfig={{
                                minBufferMs: 2500,
                                maxBufferMs: 10000,
                                bufferForPlaybackMs: 2000,
                                bufferForPlaybackAfterRebufferMs: 3000,
                            }}
                        />
                    ) : (
                        <View style={styles.videoPlaceholder} />
                    )}
                </Pressable>

                {/* 🛡️ NEW UX: THE "TEASER BAR" (Replacing the floating overlay) */}
                <Pressable
                    onPress={handlePressRebuttal}
                    style={styles.rebuttalTeaser}
                >
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
                </Pressable>

                {/* Info Overlays */}
                <View style={styles.userALabel}>
                    <Text style={styles.labelText}>@{item.sideAUsername}</Text>
                </View>

                {isActive && !status.isPlaying && (
                    <View style={styles.centerLoader}>
                        <ActivityIndicator color="#a349a4" size="large" />
                    </View>
                )}
            </View>

            <Pressable onPress={handlePressMain} style={styles.cardFooter}>
                <Text style={styles.footerCTA}>ENTER ARENA TO VOTE →</Text>
            </Pressable>
        </View>
    );
});

export const StoriesFeed = () => {
    const { data: stories, isLoading } = useGetAllCompleteStoriesQuery();
    const [activeId, setActiveId] = React.useState(null);
    const [isAppMuted, setIsAppMuted] = React.useState(false);
    const isFocused = useIsFocused();

    const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) setActiveId(viewableItems[0].item.id);
    }).current;

    if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#a349a4" /></View>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.pageHeader}>
                <Text style={styles.headerTitle}>Arena</Text>
                <Pressable onPress={() => setIsAppMuted(!isAppMuted)} style={styles.muteBtn}>
                    <Ionicons name={isAppMuted ? "volume-mute" : "volume-high"} size={22} color="white" />
                </Pressable>
            </View>
            <FlatList
                data={stories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <ArenaCard
                        item={item}
                        isActive={item.id === activeId && isFocused}
                        isAppMuted={isAppMuted}
                    />
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={VIEW_CONFIG}

                // 🛡️ THE "SOFT SNAP" SETTINGS
                // snapToInterval={620}         // The height of your card + margin
                snapToAlignment="start"
                decelerationRate="normal"    // 🛡️ CRITICAL: 'fast' is what feels aggressive. 'normal' feels like Instagram.
                disableIntervalMomentum={false} // 🛡️ Allows users to flick past multiple cards if they want

                // 🛡️ TOUCH RESPONSIVENESS
                removeClippedSubviews={true}
                windowSize={3}               // Keep a neighbor ready so the snap is smooth
                scrollEventThrottle={16}     // Ensures the 'isActive' check happens in real-time

                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    pageHeader: { paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: "#FFF", fontSize: 32, fontWeight: "900", letterSpacing: -1 },
    muteBtn: { backgroundColor: '#a349a4', padding: 10, borderRadius: 30 },

    card: { backgroundColor: "#0A0A0A", marginHorizontal: 12, marginBottom: 25, borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: '#1A1A1A' },
    cardHeader: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 75 },
    title: { color: "#FFF", fontSize: 18, fontWeight: "800" },
    typeBadge: { backgroundColor: "#a349a422", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 5, alignSelf: 'flex-start' },
    typeText: { color: "#d67bff", fontSize: 10, fontWeight: "bold" },

    stakeContainer: { alignItems: 'flex-end' },
    stakeLabel: { color: '#666', fontSize: 8, fontWeight: 'bold' },
    stakeValue: { color: "#FFD700", fontSize: 22, fontWeight: "900" },

    versusArena: { height: 500, width: '100%', backgroundColor: '#050505', position: 'relative' },
    videoPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#111' },
    centerLoader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },

    // 🛡️ NEW TEASER BAR UX
    rebuttalTeaser: {
        position: 'absolute',
        bottom: 16,
        right: 12,
        left: 12,
        backgroundColor: 'rgba(163, 73, 164, 0.95)',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#FFF',
        elevation: 8,
        zIndex: 20,
    },
    teaserAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#FFF' },
    teaserTextContainer: { flex: 1, marginLeft: 12 },
    teaserAction: { color: 'white', fontSize: 10, fontWeight: '900' },
    teaserUser: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    goCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    userALabel: { position: 'absolute', top: 15, left: 15, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    labelText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

    cardFooter: { padding: 15, backgroundColor: "#111", height: 50, justifyContent: 'center', alignItems: 'center' },
    footerCTA: { color: "#a349a4", fontSize: 12, fontWeight: "900" }
});