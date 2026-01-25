import React, { createContext, useContext, useState, useMemo } from 'react';
import { useVideoPlayer, VideoPlayer } from 'expo-video';

interface VideoContextType {
    // We change the signature to return the player OR null if not ready
    getPlayer: (id: string, url: string) => VideoPlayer | null;
    activePlayerId: string | null;
    setActivePlayerId: (id: string | null) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

// 🛡️ INTERNAL COMPONENT TO HANDLE THE HOOK SAFELY
const ManagedPlayer = ({ url }: { url: string }) => {
    return useVideoPlayer(url, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });
};

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

    // 🛡️ Instead of a warehouse of players, we'll keep it simple for the Feed.
    // The StoriesFeed cards will now create their own players locally, 
    // BUT the Provider will still track which one is 'Active'.

    const value = useMemo(() => ({
        activePlayerId,
        setActivePlayerId,
        // Dummy function to prevent breaking your current Feed code
        getPlayer: () => null
    }), [activePlayerId]);

    return (
        <VideoContext.Provider value={value}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideoValet = () => {
    const context = useContext(VideoContext);
    if (!context) throw new Error("useVideoValet must be used within a VideoProvider");
    return context;
};