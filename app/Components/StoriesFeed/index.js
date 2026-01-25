import * as React from "react";
import {
    View, Text, ActivityIndicator,
    SafeAreaView, Pressable, Dimensions,
    StyleSheet
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from '@expo/vector-icons';

// 🛡️ API & GLOBAL STATE
import { useGetAllCompleteStoriesQuery } from "@/store/api/api";
import { useVideoValet } from "../VideoProvider"; // 👈 The "Valet" we built

// 🛡️ YOUR MODULAR COMPONENT
import { ArenaCard } from "../ArenaCard"; // 👈 Ensure path is correct

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 🛡️ THE FEED (Refactored)
 */
export const StoriesFeed = () => {
    const { data: stories, isLoading } = useGetAllCompleteStoriesQuery();
    const [activeId, setActiveId] = React.useState(null);
    const [isAppMuted, setIsAppMuted] = React.useState(false);
    const isFocused = useIsFocused();

    // 🛡️ Get our "Valet" tools from the Context
    const { getPlayer, setActivePlayerId } = useVideoValet();

    // 🛡️ Sync the active ID with the Valet so it knows what to play/unmute
    React.useEffect(() => {
        if (activeId) {
            setActivePlayerId(activeId.toString());
        }
    }, [activeId, setActivePlayerId]);

    const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setActiveId(viewableItems[0].item.id);
        }
    }).current;

    if (isLoading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#a349a4" />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* --- HEADER --- */}
            <View style={styles.pageHeader}>
                <Text style={styles.headerTitle}>Arena</Text>
                <Pressable
                    onPress={() => setIsAppMuted(!isAppMuted)}
                    style={styles.muteBtn}
                >
                    <Ionicons
                        name={isAppMuted ? "volume-mute" : "volume-high"}
                        size={22}
                        color="white"
                    />
                </Pressable>
            </View>

            {/* --- FEED --- */}
            <FlashList
                data={stories}
                keyExtractor={(item) => item.id.toString()}
                onViewableItemsChanged={onViewableItemsChanged}
                estimatedItemSize={600} // Set this accurately to the card height
                windowSize={2}          // 🛡️ CRITICAL: Only keeps 2 cards in memory
                removeClippedSubviews={true} // 🛡️ CRITICAL: Purges off-screen views
                // 🛡️ THE RENDER LOGIC: THE HAND-OFF

                // Inside StoriesFeed component
                // const isFocused= useIsFocused(); // Get focus state from navigation

                // ... inside renderItem ...
                renderItem={({ item, index }) => {
                    const itemId = item.id.toString();

                    // 🛡️ CRITICAL: Only provide a player if the feed is actually on screen
                    // If we go to the FullStoryScreen, isFocused becomes false, 
                    // and the ArenaCard will receive isActive=false, triggering its cleanup.
                    const isActive = isFocused && itemId === activeId?.toString();

                    return (
                        <ArenaCard
                            item={item}
                            isActive={isActive}
                            isAppMuted={isAppMuted}
                        />
                    );
                }}
                // 🛡️ PIXEL 4 / S8 PERFORMANCE TUNING
                viewabilityConfig={{
                    itemVisiblePercentThreshold: 50 // 🛡️ Snaps exactly at halfway
                }}
                drawDistance={0}

                // 🛡️ SNAP LOGIC
                // snapToInterval={650} // 75(H) + 500(A) + 50(F) + 25(M)
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}

                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    pageHeader: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: { color: "#FFF", fontSize: 32, fontWeight: "900", letterSpacing: -1 },
    muteBtn: { backgroundColor: '#a349a4', padding: 10, borderRadius: 30 },
});