// app/components/profile/LogoutButton.tsx
import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Platform 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { createShadow } from '../../utils/platformUtils';

interface LogoutButtonProps {
  onPress: () => void;
  isLoading?: boolean;
}

/**
 * Logout button component
 * Displays a button for logging out
 */
const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  onPress, 
  isLoading = false 
}) => {
  return (
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={onPress}
      disabled={isLoading}
      accessibilityLabel="Logout button"
      testID="logout-button"
    >
      <FontAwesome name="sign-out" size={18} color="#FF3B30" />
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );
};

// Platform-specific shadows
const buttonShadow = createShadow(1);

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    ...buttonShadow,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
  },
});

export default LogoutButton;