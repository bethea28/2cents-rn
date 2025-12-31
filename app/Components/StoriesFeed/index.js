import * as React from "react";
import {
    View,
    StyleSheet,
    Text,
    FlatList,
    Pressable,
    ActivityIndicator,
    SafeAreaView,
    Dimensions
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useGetAllCompleteStoriesQuery } from "@/store/api/api";
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const { width } = Dimensions.get('window');

/**
 * ARENA CARD COMPONENT
 */
const ArenaCard = React.memo(({ item, isActive, isAppMuted }) => {
    const navigation = useNavigation();
    const hasRebuttal = !!item.sideBVideoUrl;

    // 'A' for Challenger, 'B' for Rebuttal
    const [audioFocus, setAutoFocus] = React.useState('A');

    // Reset audio focus to Challenger when card becomes inactive to keep it clean
    React.useEffect(() => {
        if (!isActive) setAutoFocus('A');
    }, [isActive]);

    return (
        <View style={styles.card}>
            {/* Header Area */}
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>{item.title}</Text>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>{item.storyType?.toUpperCase()}</Text>
                    </View>
                </View>
                <View style={styles.stakeContainer}>
                    <Text style={styles.stakeLabel}>STAKE</Text>
                    <Text style={styles.stakeValue}>{item.wager}</Text>
                </View>
            </View>

            {/* THE ARENA */}
            <View style={styles.versusArena}>

                {/* SIDE A: CHALLENGER */}
                <Pressable
                    style={styles.videoStack}
                    onPress={() => setAutoFocus('A')}
                >
                    <Video
                        source={{ uri: item.sideAVideoUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={isActive}
                        isLooping
                        isMuted={isAppMuted || !isActive || audioFocus !== 'A'}
                    />
                    <View style={[styles.topLabelContainer, audioFocus === 'A' && styles.activeAudioLabel]}>
                        <Ionicons name={audioFocus === 'A' ? "volume-high" : "volume-mute"} size={10} color="white" style={{ marginRight: 4 }} />
                        <Text style={styles.sideLabel}>CHALLENGER</Text>
                    </View>
                </Pressable>

                {/* THE HORIZON METER / VS BADGE */}
                <Pressable
                    style={styles.horizonLine}
                    onPress={() => navigation.navigate("FullStoryScreen", { story: item })}
                >
                    <View style={styles.vsBadge}>
                        <Text style={styles.vsText}>VS</Text>
                    </View>
                    <View style={styles.miniMeter}>
                        <View style={[styles.meterFill, { width: '60%', backgroundColor: '#a349a4' }]} />
                    </View>
                </Pressable>

                {/* SIDE B: REBUTTAL */}
                <Pressable
                    style={[styles.videoStack, !hasRebuttal && styles.emptySide]}
                    onPress={() => hasRebuttal ? setAutoFocus('B') : null}
                >
                    {hasRebuttal ? (
                        <Video
                            source={{ uri: item.sideBVideoUrl }}
                            style={StyleSheet.absoluteFill}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={isActive}
                            isLooping
                            isMuted={isAppMuted || !isActive || audioFocus !== 'B'}
                        />
                    ) : (
                        <View style={styles.center}>
                            <Ionicons name="hourglass-outline" size={20} color="#333" />
                            <Text style={styles.waitingText}>WAITING FOR SMOKE...</Text>
                        </View>
                    )}
                    <View style={[styles.bottomLabelContainer, audioFocus === 'B' && styles.activeAudioLabel]}>
                        <Text style={styles.sideLabel}>{hasRebuttal ? "REBUTTAL" : "WAITING"}</Text>
                        <Ionicons name={audioFocus === 'B' ? "volume-high" : "volume-mute"} size={10} color="white" style={{ marginLeft: 4 }} />
                    </View>
                </Pressable>
            </View>

            {/* Footer / Navigation Trigger */}
            <Pressable
                style={styles.cardFooter}
                onPress={() => navigation.navigate("FullStoryScreen", { story: item })}
            >
                <Text style={styles.dateText}>Settled {new Date(item.updatedAt).toLocaleDateString()}</Text>
                <Text style={styles.watchText}>ENTER ARENA →</Text>
            </Pressable>
        </View>
    );
});
/**
 * MAIN FEED COMPONENT
 */
export const StoriesFeed = () => {
    const { data: stories, isLoading, isFetching, refetch } = useGetAllCompleteStoriesQuery();
    const [activeId, setActiveId] = React.useState(null);
    const [isAppMuted, setIsAppMuted] = React.useState(true); // START MUTED (UX Law)
    const isFocused = useIsFocused();

    React.useEffect(() => {
        if (stories?.length > 0 && !activeId) {
            setActiveId(stories[0].id);
        }
    }, [stories]);

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 80,
    }).current;

    const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setActiveId(viewableItems[0].item.id);
        }
    }).current;

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#a349a4" />
                <Text style={styles.loadingText}>PREPARING THE ARENA...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* GLOBAL MUTE TOGGLE (Floating) */}
            <Pressable
                style={styles.muteToggle}
                onPress={() => setIsAppMuted(!isAppMuted)}
            >
                <Ionicons
                    name={isAppMuted ? "volume-mute" : "volume-high"}
                    size={22}
                    color="white"
                />
            </Pressable>

            <View style={styles.pageHeader}>
                <Text style={styles.headerTitle}>Arena</Text>
                <Pressable onPress={() => refetch()} style={styles.refreshIcon}>
                    <Ionicons name="flash" size={22} color="#FFD700" />
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
                viewabilityConfig={viewabilityConfig}
                contentContainerStyle={styles.listPadding}
                refreshing={isFetching}
                onRefresh={refetch}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={3}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { color: "#a349a4", marginTop: 10, fontWeight: "bold" },
    pageHeader: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { color: "#FFF", fontSize: 32, fontWeight: "900", letterSpacing: -1 },
    muteToggle: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: 'rgba(163, 73, 164, 0.8)', // Purple with transparency
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999, // Ensure it's above everything
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    listPadding: { paddingBottom: 100 },
    card: {
        backgroundColor: "#0A0A0A",
        marginHorizontal: 12,
        marginTop: 16,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#1A1A1A"
    },
    cardHeader: { padding: 16, flexDirection: "row", justifyContent: "space-between" },
    title: { color: "#FFF", fontSize: 18, fontWeight: "800" },
    typeBadge: {
        backgroundColor: "#a349a422",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#a349a4'
    },
    typeText: { color: "#d67bff", fontSize: 10, fontWeight: "bold" },
    stakeValue: { color: "#FFD700", fontSize: 20, fontWeight: "900" },
    stakeLabel: { color: "#888", fontSize: 8, fontWeight: "bold", textAlign: 'right' },

    // ARENA LAYOUT
    versusArena: { height: 380, flexDirection: "column" },
    videoStack: { flex: 1, overflow: 'hidden', position: 'relative' },
    emptySide: { backgroundColor: '#050505', justifyContent: 'center' },
    waitingText: { color: '#333', fontSize: 9, fontWeight: 'bold', marginTop: 4 },

    horizonLine: { height: 4, backgroundColor: '#1A1A1A', zIndex: 20, justifyContent: 'center' },
    vsBadge: {
        position: "absolute",
        alignSelf: "center",
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#a349a4",
        zIndex: 30
    }, activeAudioLabel: {
        backgroundColor: '#a349a4', // Purple pop when this side is "Talking"
        borderColor: '#FFF',
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    vsText: { color: "#FFF", fontWeight: "900", fontSize: 12 },
    miniMeter: { height: 4, width: '100%', backgroundColor: '#222' },
    meterFill: { height: '100%' },

    topLabelContainer: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    bottomLabelContainer: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    sideLabel: { color: "#FFF", fontSize: 9, fontWeight: "900" },

    cardFooter: { padding: 16, flexDirection: "row", justifyContent: "space-between", backgroundColor: "#0F0F0F" },
    dateText: { color: "#444", fontSize: 11, fontWeight: '600' },
    watchText: { color: "#a349a4", fontSize: 13, fontWeight: "900" }
});