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
import { useNavigation } from "@react-navigation/native";
import { useGetAllCompleteStoriesQuery } from "@/store/api/api";
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useIsFocused } from "@react-navigation/native"; //
const { width } = Dimensions.get('window');

/**
 * ARENA CARD COMPONENT
 */
const ArenaCard = React.memo(({ item, isActive }) => {
    const navigation = useNavigation();
    const hasRebuttal = !!item.sideBVideoUrl;

    return (
        <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("FullStoryScreen", { story: item })}
        >
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

            <View style={styles.versusArena}>
                {/* SIDE A: CHALLENGER */}
                <View style={styles.videoHalf}>
                    <Video
                        source={{ uri: item.sideAVideoUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={isActive}
                        isLooping
                        isMuted={false}
                        // STAFF FIX: Firebase sometimes needs headers or explicit stays
                        shouldCorrectPitch={true}
                        progressUpdateIntervalMillis={1000}
                        // Added to ensure the video container is active
                        onLoadStart={() => console.log(`Loading Side A for: ${item.title}`)}
                        onError={(err) => console.log("Video Error:", err)}
                    />
                    <View style={styles.overlay}>
                        <Text style={styles.sideLabel}>CHALLENGER</Text>
                    </View>
                </View>

                <View style={styles.vsBadge}><Text style={styles.vsText}>VS</Text></View>

                {/* SIDE B: REBUTTAL */}
                <View style={[styles.videoHalf, !hasRebuttal && styles.emptySide]}>
                    {hasRebuttal ? (
                        <Video
                            source={{
                                uri: item.sideBVideoUrl,
                                headers: { 'User-Agent': 'MobileApp' }
                            }}
                            style={StyleSheet.absoluteFill}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={isActive}
                            isLooping
                            isMuted={true}
                        />
                    ) : (
                        <View style={styles.center}>
                            <Ionicons name="hourglass-outline" size={24} color="#666" />
                        </View>
                    )}
                    <View style={styles.overlay}>
                        <Text style={styles.sideLabel}>{hasRebuttal ? "REBUTTAL" : "WAITING..."}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>Settled {new Date(item.updatedAt).toLocaleDateString()}</Text>
                <Text style={styles.watchText}>WATCH DUEL →</Text>
            </View>
        </Pressable>
    );
});
/**
 * MAIN FEED COMPONENT
 */
export const StoriesFeed = () => {
    const { data: stories, isLoading, isFetching, refetch } = useGetAllCompleteStoriesQuery();
    const [activeId, setActiveId] = React.useState(null);
    const isFocused = useIsFocused(); //
    // Ensure the first video plays if nothing has scrolled yet
    React.useEffect(() => {
        if (stories?.length > 0 && !activeId) {
            setActiveId(stories[0].id);
        }
    }, [stories]);

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 60, // Card must be 60% visible to trigger play
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
                <Text style={styles.loadingText}>LOADING ARENA...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.pageHeader}>
                <Text style={styles.headerTitle}>Arena</Text>
                <Pressable onPress={() => refetch()} style={styles.refreshIcon}>
                    <Ionicons name="refresh" size={22} color="white" />
                </Pressable>
            </View>

            <FlatList
                data={stories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <ArenaCard
                        item={item}
                        // Card only plays if it's the active item AND the tab is focused
                        isActive={item.id === activeId && isFocused}
                    />
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                contentContainerStyle={styles.listPadding}
                refreshing={isFetching}
                onRefresh={refetch}
                showsVerticalScrollIndicator={false}
                // Performance settings
                removeClippedSubviews={true}
                initialNumToRender={2}
                maxToRenderPerBatch={3}
                windowSize={5}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { color: "#a349a4", marginTop: 10, fontWeight: "bold", letterSpacing: 1 },
    pageHeader: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#222'
    },
    headerTitle: { color: "#FFF", fontSize: 28, fontWeight: "900" },
    refreshIcon: { padding: 5 },
    listPadding: { paddingBottom: 40 },
    card: {
        backgroundColor: "#111",
        marginHorizontal: 16,
        marginTop: 20,
        borderRadius: 15,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#333"
    },
    cardHeader: {
        padding: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    headerLeft: { flex: 1 },
    title: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
    typeBadge: {
        backgroundColor: "#a349a433",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#a349a4'
    },
    typeText: { color: "#d67bff", fontSize: 10, fontWeight: "bold" },
    stakeContainer: { alignItems: 'flex-end', marginLeft: 10 },
    stakeLabel: { color: "#888", fontSize: 8, fontWeight: "bold" },
    stakeValue: { color: "#FFD700", fontSize: 16, fontWeight: "bold" },
    versusArena: { height: 180, flexDirection: "row", position: "relative", backgroundColor: '#050505' },
    videoHalf: { flex: 1, overflow: 'hidden', backgroundColor: 'red' },
    emptySide: { backgroundColor: '#0a0a0a' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end",
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingBottom: 10
    },
    sideLabel: { color: "#FFF", fontSize: 9, fontWeight: "bold", letterSpacing: 1, textShadowColor: 'black', textShadowRadius: 4 },
    vsBadge: {
        position: "absolute",
        zIndex: 10,
        left: '50%',
        marginLeft: -18,
        top: "50%",
        marginTop: -18,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#a349a4",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#111"
    },
    vsText: { color: "#FFF", fontWeight: "900", fontSize: 12 },
    cardFooter: {
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
        backgroundColor: "#161616"
    },
    dateText: { color: "#666", fontSize: 11 },
    actionRow: { flexDirection: 'row', alignItems: 'center' },
    watchText: { color: "#a349a4", fontSize: 12, fontWeight: "bold", marginRight: 4 }
});