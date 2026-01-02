import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const BattleMeter = ({ meterAnim, isArenaLit }) => {

    // DEBUG: This will tell us if the value is actually changing
    // You can remove this useEffect once it's moving
    useEffect(() => {
        const listenerId = meterAnim.addListener(({ value }) => {
            // console.log("METER ANIMATING TO:", value);
        });
        return () => meterAnim.removeListener(listenerId);
    }, [meterAnim]);

    // 🛠 THE CENTER LOCK MAPPING
    // 15% (Min Left) | 50% (Center) | 85% (Min Right)
    const vsPosition = meterAnim.interpolate({
        inputRange: [15, 50, 85],
        outputRange: [20, (width / 2) - 20, width - 60],
        extrapolate: 'clamp'
    });

    const fillWidth = meterAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={styles.meterContainer}>
            <View style={[
                styles.track,
                { backgroundColor: isArenaLit ? '#00D1FF' : 'rgba(0, 209, 255, 0.2)' }
            ]}>
                <Animated.View style={[
                    styles.fill,
                    {
                        width: fillWidth,
                        backgroundColor: isArenaLit ? '#a349a4' : 'rgba(163, 73, 164, 0.2)',
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
        height: 18,
        width: '100%',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 99,
    },
    track: {
        height: 18,
        width: '100%',
        flexDirection: 'row',
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
    },
    badge: {
        position: 'absolute',
        top: -11,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000',
        borderWidth: 3,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    badgeText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 12,
    }
});