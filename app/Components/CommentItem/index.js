import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const CommentItem = ({ comment, isReply = false }) => {
    // Logic: Map Team A to Purple, Team B to Cyan, Neutral to Grey
    const teamColor =
        comment.side === 'A' ? '#a349a4' :
            comment.side === 'B' ? '#00D1FF' : '#444';

    return (
        <View style={[
            styles.container,
            isReply && styles.replyIndent,
            { borderLeftColor: teamColor }
        ]}>
            <View style={styles.header}>
                <Text style={[styles.username, { color: teamColor }]}>
                    {comment.author?.username || 'Anonymous'}
                    <Text style={styles.sideLabel}> • TEAM {comment.side}</Text>
                </Text>
            </View>

            <Text style={styles.content}>{comment.content}</Text>

            <View style={styles.footer}>
                <Text style={styles.footerText}>{comment.likesCount || 0} 🔥</Text>
                <Text style={styles.footerAction}>REPLY</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1A1A1A',
        padding: 12,
        marginVertical: 4,
        marginHorizontal: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
    },
    replyIndent: {
        marginLeft: 40,
        backgroundColor: '#121212',
        opacity: 0.9,
    },
    username: { fontWeight: '900', fontSize: 13, marginBottom: 2 },
    sideLabel: { fontSize: 10, color: '#666', fontWeight: '400' },
    content: { color: '#EEE', fontSize: 14, lineHeight: 18 },
    footer: { flexDirection: 'row', marginTop: 8, gap: 15 },
    footerText: { color: '#666', fontSize: 11, fontWeight: '700' },
    footerAction: { color: '#a349a4', fontSize: 11, fontWeight: '900' }
});