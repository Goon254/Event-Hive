// app/components/profile/LogoutButton.tsx
import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Platform,
  Animated,
  View
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createShadow } from '../../utils/platformUtils';

interface LogoutButtonProps {
  onPress: () => void;
  isLoading?: boolean;
}

/**
 * Logout button component
 * Displays a button for logging out with enhanced visual effects
 */
const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  onPress, 
  isLoading = false 
}) => {
  // Animation for press feedback
  const [scaleAnim] = useState(new Animated.Value(1));
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading}
        accessibilityLabel="Logout button"
        testID="logout-button"
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF3B30']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.logoutButton}
        >
          <View style={styles.iconContainer}>
            <FontAwesome name="sign-out" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 30,
    paddingVertical: 16,
    marginHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FFFFFF',
  },
});

export default LogoutButton;