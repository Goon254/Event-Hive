// app/components/common/LoadingIndicator.tsx
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingIndicatorProps {
  message?: string;
  small?: boolean;
  color?: string;
}

/**
 * Loading indicator component
 * Displays a spinner with optional message
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = 'Loading...', 
  small = false,
  color = '#007AFF'
}) => {
  if (small) {
    return (
      <View style={styles.smallContainer} testID="loading-indicator-small">
        <ActivityIndicator size="small" color={color} />
        {message && <Text style={styles.smallText}>{message}</Text>}
      </View>
    );
  }
  
  return (
    <View style={styles.container} testID="loading-indicator">
      <ActivityIndicator size="large" color={color} />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  smallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  smallText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default LoadingIndicator;