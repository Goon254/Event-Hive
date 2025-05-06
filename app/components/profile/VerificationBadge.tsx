// app/components/profile/VerificationBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VerificationBadgeProps {
  isVerified: boolean;
  verifiedText?: string;
  unverifiedText?: string;
}

/**
 * A reusable component for displaying verification status
 * Updated to match the app's new styling approach
 */
const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  verifiedText = 'Verified',
  unverifiedText = 'Not Verified',
}) => {
  if (isVerified) {
    return (
      <View 
        style={styles.verifiedBadge}
        accessibilityRole="text"
        accessibilityLabel={verifiedText}
      >
        <Ionicons name="checkmark-circle" size={16} color="#00BFA6" />
        <Text style={styles.verifiedText}>{verifiedText}</Text>
      </View>
    );
  }
  
  return (
    <View 
      style={styles.unverifiedBadge}
      accessibilityRole="text"
      accessibilityLabel={unverifiedText}
    >
      <Ionicons name="alert-circle" size={16} color="#F59E0B" />
      <Text style={styles.unverifiedText}>{unverifiedText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 191, 166, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 166, 0.2)',
  },
  verifiedText: {
    fontSize: 12,
    color: '#00BFA6',
    fontWeight: '500',
    marginLeft: 4,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  unverifiedText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default VerificationBadge;