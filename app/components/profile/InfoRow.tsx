// app/components/profile/InfoRow.tsx
import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/constants';

interface InfoRowProps {
  icon: string;
  iconColor?: string;
  label: string;
  value: string;
  rightContent?: ReactNode;
  onPress?: () => void;
}

/**
 * A reusable component for displaying a row of information with an icon, label, and value
 * Updated to match the app's new styling approach
 */
const InfoRow: React.FC<InfoRowProps> = ({
  icon,
  iconColor = COLORS.primary, // Using COLORS.primary instead of hardcoded value
  label,
  value,
  rightContent,
  onPress,
}) => {
  return (
    <View 
      style={styles.infoItem}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.infoLabelContainer}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={styles.infoValueContainer}>
        <Text 
          style={styles.infoValue}
          selectable={true}
        >
          {value}
        </Text>
        {rightContent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoItem: {
    flexDirection: 'column',
    paddingVertical: 12,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text, // Changed to use COLORS.text for better visibility
    marginLeft: 8,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text, // Changed to use COLORS.text for better visibility
    paddingLeft: 28,
    flex: 1,
  },
});

export default InfoRow;