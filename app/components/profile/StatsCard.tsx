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
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    ...cardShadow,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
});

export default StatsCard;