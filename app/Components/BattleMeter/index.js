import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const BADGE_WIDTH = 40;

export const BattleMeter = ({ voteAnim, isArenaLit, votesA = 0, votesB = 0 }) => {
    const totalVotes = votesA + votesB;

    // 🛡️ UX Logic: If no votes, we visually stay at 50% but keep colors neutral.
    // If there are votes, we calculate the real percentage.
    const targetPercentage = totalVotes === 0 ? 50 : (votesA / totalVotes) * 100;

    const [displayScore, setDisplayScore] = useState(targetPercentage);

    useEffect(() => {
        Animated.timing(voteAnim, {
            toValue: targetPercentage,
            duration: 600,
            useNativeDriver: false,
        }).start();

        const id = voteAnim.addListener(({ value }) => {
            setDisplayScore(Math.round(value));
        });
        return () => voteAnim.removeListener(id);
    }, [targetPercentage]);

    const vsPosition = voteAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [-BADGE_WIDTH / 2, width - (BADGE_WIDTH / 2)],
        extrapolate: 'clamp'
    });

    const fillWidth = voteAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    // 🛡️ Style Helpers for the "Neutral" State
    const hasVotes = totalVotes > 0;
    const sideAColor = hasVotes && isArenaLit ? '#a349a4' : '#333'; // Dark gray if no votes
    const sideBColor = hasVotes && isArenaLit ? '#00D1FF' : '#222'; // Deeper gray if no votes
    const textColor = hasVotes && isArenaLit ? '#fff' : '#666';

    return (
        <View style={styles.meterContainer}>
            <View style={styles.numberRow}>
                {/* 🛡️ Show 0 if no votes, otherwise show percentage */}
                <Text style={[styles.percentageText, { color: sideAColor }]}>
                    {hasVotes ? `${displayScore}%` : '0'}
                </Text>
                <Text style={[styles.percentageText, { color: sideBColor }]}>
                    {hasVotes ? `${100 - displayScore}%` : '0'}
                </Text>
            </View>

            <View style={[styles.track, { backgroundColor: sideBColor }]}>
                <Animated.View style={[
                    styles.fill,
                    {
                        width: fillWidth,
                        backgroundColor: sideAColor,
                        borderRightWidth: hasVotes ? 2 : 0,
                    }
                ]} />
            </View>

            <Animated.View style={[
                styles.badge,
                {
                    left: vsPosition,
                    opacity: hasVotes ? 1 : 0.6, // Dim the badge if no votes
                    transform: [{ scale: hasVotes ? 1 : 0.8 }]
                }
            ]}>
                <Text style={styles.badgeText}>VS</Text>
            </Animated.View>

            {!hasVotes && (
                <Text style={styles.promptText}>BE THE FIRST TO VOTE</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    meterContainer: { width: '100%', paddingVertical: 15, alignItems: 'center' },
    numberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    percentageText: { fontSize: 22, fontWeight: '900', fontStyle: 'italic' },
    track: { height: 14, width: '100%', overflow: 'hidden', borderRadius: 7 },
    fill: { height: '100%', borderColor: '#fff' },
    badge: {
        position: 'absolute',
        bottom: 5,
        width: BADGE_WIDTH,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000',
        borderWidth: 3,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    badgeText: { color: '#fff', fontWeight: '900', fontSize: 12 },
    promptText: {
        marginTop: 15,
        fontSize: 10,
        fontWeight: '700',
        color: '#555',
        letterSpacing: 2,
    }
});