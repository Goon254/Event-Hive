// app/components/common/FloatingActionButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  colors?: [string, string, ...string[]];
  size?: number;
  iconSize?: number;
  iconColor?: string;
}

/**
 * Floating action button component
 * Displays a gradient button with an icon
 */
const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onPress, 
  icon = 'qr-code-scanner',
  colors = ['#007AFF', '#4F46E5'],
  size = 56,
  iconSize = 24,
  iconColor = '#FFFFFF'
}) => {
  return (
    <TouchableOpacity 
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityLabel={icon.replace(/-/g, ' ')}
      accessibilityRole="button"
      testID={`floating-action-button-${icon}`}
    >
      <LinearGradient
        colors={colors}
        style={[styles.gradient, { width: size, height: size, borderRadius: size / 2 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialIcons name={icon} size={iconSize} color={iconColor} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FloatingActionButton;