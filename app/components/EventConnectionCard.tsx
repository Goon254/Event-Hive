// app/components/EventConnectionCard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { EnhancedConnection } from '../models/connection/types';
import eventConnectionService from '../services/eventConnectionService';
import { useTheme } from '../theme/useTheme';

interface EventConnectionCardProps {
  connection: EnhancedConnection;
  currentUserId: string;
  onConnect: (id: string, action: 'connect' | 'follow') => void;
  isPending?: boolean;
  isAccepted?: boolean;
}

/**
 * Component for displaying a connection card with simplified actions
 * Enhanced with frosted-glass styling and improved visual hierarchy
 */
export const EventConnectionCard: React.FC<EventConnectionCardProps> = ({
  connection,
  currentUserId,
  onConnect,
  isPending = false,
  isAccepted = false,
}) => {
  const theme = useTheme();
  const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Check if the connection is an organizer
  useEffect(() => {
    const checkOrganizer = async () => {
      try {
        setIsLoading(true);
        const result = await eventConnectionService.isUserEventOrganizer(
          connection.userId === currentUserId ? connection.connectionId : connection.userId
        );
        setIsOrganizer(result);
      } catch (error) {
        console.error('Error checking if user is an organizer:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOrganizer();
  }, [connection, currentUserId]);
  
  // Get the other user's ID (not the current user)
  const otherUserId = connection.userId === currentUserId 
    ? connection.connectionId 
    : connection.userId;
  
  // Render the appropriate button based on connection status
  const renderButton = () => {
    if (isLoading) {
      return (
        <View style={[styles.button, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }
    
    if (isPending) {
      return (
        <View style={[styles.button, { 
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }]}>
          <Text style={[styles.buttonText, { color: theme.isDark ? '#FFFFFF' : theme.colors.text }]}>Pending</Text>
        </View>
      );
    }
    
    if (isAccepted) {
      return (
        <View style={[styles.button, { 
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }]}>
          <Text style={[styles.buttonText, { color: theme.isDark ? '#FFFFFF' : theme.colors.text }]}>Connected</Text>
        </View>
      );
    }
    
    if (isOrganizer) {
      return (
        <TouchableOpacity 
          style={[styles.button, { 
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
          }]}
          onPress={() => onConnect(otherUserId, 'follow')}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Follow Organizer</Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity 
        style={[styles.button, { 
          backgroundColor: theme.colors.primary,
          shadowColor: theme.colors.primary,
        }]}
        onPress={() => onConnect(otherUserId, 'connect')}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Add to My Network</Text>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.isDark 
          ? 'rgba(255, 255, 255, 0.04)' 
          : 'rgba(0, 0, 0, 0.02)',
        borderColor: theme.isDark 
          ? 'rgba(255, 255, 255, 0.08)' 
          : 'rgba(0, 0, 0, 0.05)'
      }
    ]}>
      <View style={styles.avatarContainer}>
        <Image 
          source={
            connection.avatar
              ? { uri: connection.avatar }
              : require('../../assets/images/default-avatar.png')
          } 
          style={styles.avatar} 
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={[
          styles.name, 
          { color: theme.isDark ? '#FFFFFF' : theme.colors.text }
        ]}>
          {connection.name}
        </Text>
        {connection.role && (
          <Text style={[
            styles.role, 
            { color: theme.isDark ? '#D1D5DB' : theme.colors.textSecondary }
          ]}>
            {connection.role}
          </Text>
        )}
        {isOrganizer && (
          <Text style={[
            styles.organizer, 
            { color: theme.isDark ? '#A78BFA' : theme.colors.primary }
          ]}>
            Event Organizer
          </Text>
        )}
      </View>
      
      <View style={styles.actionContainer}>
        {renderButton()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, 
    shadowRadius: 10,
    elevation: 4,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  role: {
    fontSize: 13,
    marginBottom: 2,
  },
  organizer: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionContainer: {
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default EventConnectionCard;