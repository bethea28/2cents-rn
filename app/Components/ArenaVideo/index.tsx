// Components/ArenaVideo.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { VideoView, VideoPlayer } from 'expo-video';

interface ArenaVideoProps {
    player: VideoPlayer | null;
    isActive: boolean;
    dimmed?: boolean; // For Phase 3 (Split Screen)
}

export const ArenaVideo = React.memo(({ player, isActive, dimmed }: ArenaVideoProps) => {
    if (!isActive || !player) return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050505' }]} />;

    return (
        <VideoView
            style={[
                StyleSheet.absoluteFill,
                { opacity: dimmed ? 0.5 : 1 } // 🛡️ Phase 3: Visual hierarchy
            ]}
            player={player}
            contentFit="cover"
            // 🛡️ Optimized for Android 14 / Pixel 4
            allowsVideoFrameAnalysis={false}
            nativeControls={false}
        />
    );
});