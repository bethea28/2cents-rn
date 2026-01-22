// Components/VideoPlayerPlayback.js
import React, { memo, useEffect } from 'react';
import { useVideoPlayer, VideoView, useEvent } from 'expo-video';

export const VideoPlayerPlayback = memo(({
    videoSource,
    style,
    isMuted = true,
    paused = false, // 🛡️ Added to allow the feed to pause background videos
    onLoad
}) => {
    const player = useVideoPlayer(videoSource, (p) => {
        p.loop = true;
        p.muted = isMuted;
        if (!paused) p.play();
    });

    // 🛡️ ENGINEER: useEvent is the modern, "Safe" way to track status without leaks
    const { status } = useEvent(player, 'statusChange', { status: player.status });

    useEffect(() => {
        if (status === 'readyToPlay') {
            onLoad?.();
            if (!paused) player.play();
        }
    }, [status, paused, player, onLoad]);

    // 🛡️ Sync paused/muted props from the parent
    useEffect(() => {
        player.muted = isMuted;
        if (paused) {
            player.pause();
        } else {
            player.play();
        }
    }, [isMuted, paused, player]);

    return (
        <VideoView
            player={player}
            style={style}
            contentFit="cover"
            // 🛡️ CRITICAL SAMSUNG FIX: 
            // TextureView is required for stable rendering in lists on Galaxy S8/S21
            nativeViewType="textureView"
            nativeControls={false}
        />
    );
});