// app/components/connections/ConnectionTabs.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

interface ConnectionTabsProps {
  activeTab: 'connections' | 'pending' | 'suggested' | 'discover';
  setActiveTab: (tab: 'connections' | 'pending' | 'suggested' | 'discover') => void;
  pendingCount: number;
}

/**
 * Connection tabs component
 * Displays tabs for navigating between different connection views
 */
const ConnectionTabs: React.FC<ConnectionTabsProps> = ({ 
  activeTab, 
  setActiveTab, 
  pendingCount 
}) => {
  return (
    <View style={styles.tabsContainer} testID="connection-tabs">
      <TouchableOpacity
        style={[styles.tab, activeTab === 'connections' && styles.activeTab]}
        onPress={() => setActiveTab('connections')}
        accessibilityLabel="Connected tab"
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'connections' }}
        testID="tab-connections"
      >
        <Text 
          style={[
            styles.tabText, 
            activeTab === 'connections' && styles.activeTabText
          ]}
        >
          Connected
        </Text>
        {activeTab === 'connections' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
        onPress={() => setActiveTab('pending')}
        accessibilityLabel="Pending tab"
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'pending' }}
        testID="tab-pending"
      >
        <Text 
          style={[
            styles.tabText, 
            activeTab === 'pending' && styles.activeTabText
          ]}
        >
          Pending
          {pendingCount > 0 && (
            <Text style={styles.tabBadge}> {pendingCount}</Text>
          )}
        </Text>
        {activeTab === 'pending' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'suggested' && styles.activeTab]}
        onPress={() => setActiveTab('suggested')}
        accessibilityLabel="Suggested tab"
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'suggested' }}
        testID="tab-suggested"
      >
        <Text 
          style={[
            styles.tabText, 
            activeTab === 'suggested' && styles.activeTabText
          ]}
        >
          Suggested
        </Text>
        {activeTab === 'suggested' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
        onPress={() => setActiveTab('discover')}
        accessibilityLabel="Discover tab"
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'discover' }}
        testID="tab-discover"
      >
        <Text 
          style={[
            styles.tabText, 
            activeTab === 'discover' && styles.activeTabText
          ]}
        >
          Discover
        </Text>
        {activeTab === 'discover' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabBadge: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    height: 3,
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});

export default ConnectionTabs;