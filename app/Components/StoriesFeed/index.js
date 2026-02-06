import * as React from "react";
import {
    View, Text, ActivityIndicator,
    SafeAreaView, Pressable, Dimensions,
    StyleSheet, Platform
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from '@expo/vector-icons';

import { useGetAllCompleteStoriesQuery, useGetGlobalFeedQuery } from "@/store/api/api";
import { useVideoValet } from "../VideoProvider";
import { ArenaCard } from "../ArenaCard";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = 650; // 🛡️ Calculated total height of ArenaCard + margin

export const StoriesFeed = () => {
    const { data: stories, isLoading } = useGetGlobalFeedQuery();
    const [activeId, setActiveId] = React.useState(null);
    const [isAppMuted, setIsAppMuted] = React.useState(false);
    const isFocused = useIsFocused();
    const { setActivePlayerId } = useVideoValet();

    React.useEffect(() => {
        if (activeId) {
            setActivePlayerId(activeId.toString());
        }
    }, [activeId, setActivePlayerId]);

    // 🛡️ STAFF FIX: Stabilize this function to prevent FlashList re-renders
    const onViewableItemsChanged = React.useMemo(() => ({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            const topItem = viewableItems[0].item;
            setActiveId(topItem.id);
        }
    }, []);

    // 🛡️ STAFF FIX: Stabilize config
    const viewabilityConfig = React.useMemo(() => ({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 100 // Prevents "flashing" when scrolling fast
    }), []);

    if (isLoading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#a349a4" />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.pageHeader}>
                <Text style={styles.headerTitle}>Arena</Text>
                <Pressable onPress={() => setIsAppMuted(!isAppMuted)} style={styles.muteBtn}>
                    <Ionicons name={isAppMuted ? "volume-mute" : "volume-high"} size={22} color="white" />
                </Pressable>
            </View>

            <FlashList
                data={stories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <ArenaCard
                        item={item}
                        isActive={isFocused && item.id.toString() === activeId?.toString()}
                        isAppMuted={isAppMuted}
                        thumbnailA={item.sideAThumbnailUrl}
                        thumbnailB={item.sideBThumbnailUrl}
                    />
                )}

                // 🛡️ PERFORMANCE SETTINGS
                estimatedItemSize={CARD_HEIGHT}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}

                // 🛡️ S8 SMOOTHNESS
                drawDistance={SCREEN_HEIGHT} // Pre-renders one full screen's worth of content
                removeClippedSubviews={true}

                // 🛡️ SNAPPING LOGIC (Better than pagingEnabled for varying heights)
                // snapToInterval={CARD_HEIGHT}
                // snapToAlignment="start"
                // decelerationRate="fast"

                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        </SafeAreaView>
    );
};

// ... Styles stay the same ...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    pageHeader: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000'
    },
    headerTitle: { color: "#FFF", fontSize: 32, fontWeight: "900", letterSpacing: -1 },
    muteBtn: { backgroundColor: '#a349a4', padding: 10, borderRadius: 30 },
});