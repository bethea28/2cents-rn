import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// 🛡️ Added 'initialValue' prop to prevent the 50/50 flicker
export const BattleMeter = ({ focusAnim, voteAnim, isArenaLit, initialValue = 50 }) => {

    // Initialize state with the ACTUAL score from the start
    const [displayScore, setDisplayScore] = useState(initialValue);

    useEffect(() => {
        const id = voteAnim.addListener(({ value }) => {
            setDisplayScore(Math.round(value));
        });
        return () => voteAnim.removeListener(id);
    }, [voteAnim]);

    const vsPosition = voteAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [0, width - 40],
        extrapolate: 'clamp'
    });

    const fillWidth = voteAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={styles.meterContainer}>
            <View style={styles.numberRow}>
                {/* 🛡️ Side A Label (Purple) */}
                <Text style={[styles.percentageText, { color: isArenaLit ? '#a349a4' : '#444' }]}>
                    {displayScore}%
                </Text>
                {/* 🛡️ Side B Label (Cyan) */}
                <Text style={[styles.percentageText, { color: isArenaLit ? '#00D1FF' : '#444' }]}>
                    {100 - displayScore}%
                </Text>
            </View>

            <View style={[
                styles.track,
                { backgroundColor: isArenaLit ? '#00D1FF' : '#111' }
            ]}>
                <Animated.View style={[
                    styles.fill,
                    {
                        width: fillWidth,
                        backgroundColor: isArenaLit ? '#a349a4' : '#333',
                        borderRightWidth: isArenaLit ? 2 : 0,
                        borderColor: '#fff',
                    }
                ]} />
            </View>

            <Animated.View style={[styles.badge, { left: vsPosition }]}>
                <Text style={styles.badgeText}>VS</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    meterContainer: {
        height: 40, // Increased height to fit numbers above the bar
        width: '100%',
        justifyContent: 'flex-end', // Keeps bar at bottom, numbers at top
        position: 'relative',
        zIndex: 99,
        paddingBottom: 10
    },
    numberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 4,
    },
    percentageText: {
        fontSize: 12,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    track: { height: 14, width: '100%', flexDirection: 'row', overflow: 'hidden' },
    fill: { height: '100%' },
    badge: {
        position: 'absolute',
        bottom: 0, // Align with the new bottom-weighted track
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#000',
        borderWidth: 3,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    badgeText: { color: '#fff', fontWeight: '900', fontSize: 10 }
});