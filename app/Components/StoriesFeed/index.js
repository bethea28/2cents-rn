import * as React from "react";
import {
    View, Text, ActivityIndicator,
    SafeAreaView, Pressable, Dimensions,
    StyleSheet, Platform
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from '@expo/vector-icons';

// 🛡️ API & GLOBAL STATE
import { useGetAllCompleteStoriesQuery } from "@/store/api/api";
import { useVideoValet } from "../VideoProvider";

// 🛡️ YOUR MODULAR COMPONENT
import { ArenaCard } from "../ArenaCard";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 🛡️ THE FEED (Full Refactor with Thumbnail Logic)
 */
export const StoriesFeed = () => {
    const { data: stories, isLoading } = useGetAllCompleteStoriesQuery();
    const [activeId, setActiveId] = React.useState(null);
    const [isAppMuted, setIsAppMuted] = React.useState(false);
    const isFocused = useIsFocused();

    // 🛡️ Get our "Valet" tools from the Context
    const { setActivePlayerId } = useVideoValet();

    // 🛡️ Sync the active ID with the Valet
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
                estimatedItemSize={600}
                windowSize={3}          // 🛡️ Pre-loads one extra card for smoother scrolling
                removeClippedSubviews={Platform.OS === 'android'}

                renderItem={({ item }) => {
                    const itemId = item.id.toString();

                    // 🛡️ Only play if this screen is active and this card is in view
                    const isActive = isFocused && itemId === activeId?.toString();

                    return (
                        <ArenaCard
                            item={item}
                            isActive={isActive}
                            isAppMuted={isAppMuted}
                            // 🛡️ THUMBNAIL LOGIC: Pass these to the card to use as "Posters"
                            thumbnailA={item.sideAThumbnailUrl}
                            thumbnailB={item.sideBThumbnailUrl}
                        />
                    );
                }}

                // 🛡️ S8 PERFORMANCE & SNAP TUNING
                viewabilityConfig={{
                    itemVisiblePercentThreshold: 50
                }}

                // 🛡️ Optimizes recycling based on the type of post
                getItemType={(item) => item.storyType}

                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}

                // 🛡️ Android Snapping logic
                // pagingEnabled={Platform.OS === 'android'}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
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
        alignItems: 'center',
        backgroundColor: '#000'
    },
    headerTitle: { color: "#FFF", fontSize: 32, fontWeight: "900", letterSpacing: -1 },
    muteBtn: { backgroundColor: '#a349a4', padding: 10, borderRadius: 30 },
});