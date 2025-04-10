// app/components/connections/EncryptionIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EncryptionIndicatorProps {
  enabled: boolean;
  onToggle: () => void;
}

/**
 * Encryption indicator component
 * Displays encryption status with toggle functionality
 */
const EncryptionIndicator: React.FC<EncryptionIndicatorProps> = ({ enabled, onToggle }) => {
  return (
    <TouchableOpacity 
      style={styles.encryptionIndicator}
      onPress={onToggle}
      accessibilityLabel={`End-to-end encryption ${enabled ? 'enabled' : 'disabled'}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      testID="encryption-indicator"
    >
      <MaterialCommunityIcons 
        name="shield-lock" 
        size={16} 
        color={enabled ? "#10B981" : "#6B7280"} 
      />
      <Text style={[
        styles.encryptionText,
        { color: enabled ? "#10B981" : "#6B7280" }
      ]}>
        E2E
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  encryptionIndicator: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  encryptionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default EncryptionIndicator;