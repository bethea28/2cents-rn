// Components/VideoPlayerPlayback.js
import React, { memo, useEffect, useRef } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';

export const VideoPlayerPlayback = memo(({
    videoSource,
    style,
    isMuted = true,
    onLoad
}) => {
    const hasTriggeredLoad = useRef(false);

    const player = useVideoPlayer(videoSource, (p) => {
        p.loop = true;
        p.muted = isMuted;
        p.play();
    });

    useEffect(() => {
        console.log("🎬 Video Player Effect Mounted");

        // 1. Check current status immediately (in case it loaded before the listener attached)
        if (player.status === 'readyToPlay' && !hasTriggeredLoad.current) {
            console.log("🎯 Already ready! Firing onLoad...");
            hasTriggeredLoad.current = true;
            onLoad?.();
        }

        // 2. Listen for the change
        const subscription = player.addListener('statusChange', (statusObj) => {
            // 🛠 ENGINEER: Access the .status property from the object
            const currentStatus = statusObj.status;
            console.log("🎥 Player Status Changed To:", currentStatus);

            if (currentStatus === 'readyToPlay' && !hasTriggeredLoad.current) {
                console.log("🎯 Hit readyToPlay! Firing onLoad...");
                hasTriggeredLoad.current = true;
                onLoad?.();
            }
        });

        return () => {
            console.log("🗑 Cleaning up video listener");
            subscription.remove();
        };
    }, [player, onLoad]); // ⚠️ Remove videoSource from here to prevent unnecessary remounts

    return (
        <VideoView
            player={player}
            style={style}
            contentFit="cover"
        />
    );
});