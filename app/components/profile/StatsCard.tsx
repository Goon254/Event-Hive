// app/components/profile/StatsCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createShadow } from '../../utils/platformUtils';
import { UserProfile } from '../../services/profileService';

interface StatsCardProps {
  stats: UserProfile['stats'];
}

/**
 * Stats card component
 * Displays user statistics (events attended, events created, connections)
 */
const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  return (
    <View style={styles.statsContainer} testID="stats-card">
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats?.eventsAttended || 0}</Text>
        <Text style={styles.statLabel}>Events Attended</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats?.eventsCreated || 0}</Text>
        <Text style={styles.statLabel}>Events Created</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats?.connections || 0}</Text>
        <Text style={styles.statLabel}>Connections</Text>
      </View>
    </View>
  );
};

// Platform-specific shadows
const cardShadow = createShadow(3);

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 20,
    paddingHorizontal: 12,
    ...cardShadow,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontSize: 13,
    color: '#D1D5DB',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'center',
  },
});


export default StatsCard;