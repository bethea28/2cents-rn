import React, { memo, useEffect } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';

export const VideoPlayerPlayback = memo(({
    videoSource,
    style,
    isMuted = true,
    paused = false,
    onLoad
}) => {
    const player = useVideoPlayer(videoSource, (p) => {
        p.loop = true;
        p.muted = isMuted;
        if (!paused) p.play();
    });

    // 🛡️ REPLACEMENT FOR useEvent:
    // We check player.status directly in a specialized effect.
    // This is the most compatible way for older Expo SDKs.
    useEffect(() => {
        if (player.status === 'readyToPlay') {
            onLoad?.();
            if (!paused) player.play();
        }
    }, [player.status, paused, onLoad]);

    // 🛡️ Sync paused/muted props from the parent
    useEffect(() => {
        player.muted = isMuted;
        if (paused) {
            player.pause();
        } else {
            // Only play if we are focused and ready
            if (player.status === 'readyToPlay') {
                player.play();
            }
        }
    }, [isMuted, paused, player, player.status]);

    return (
        <VideoView
            player={player}
            style={style}
            contentFit="cover"
            // 🛡️ SAMSUNG FIX: Kept as requested for S8 stability
            nativeViewType="textureView"
            nativeControls={false}
        />
    );
});