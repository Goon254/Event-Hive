// app/components/connections/ContactMatchCard.tsx
import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ContactMatch } from '../../models/connection/types';
import { createShadow } from '../../utils/platformUtils';

interface ContactMatchCardProps {
  item: ContactMatch;
  onConnect: (id: string, action: 'connect') => void;
}

/**
 * Contact match card component
 * Displays a single contact match with user info and connect button
 */
const ContactMatchCard: React.FC<ContactMatchCardProps> = ({ item, onConnect }) => {
  return (
    <TouchableOpacity 
      style={styles.contactCard}
      activeOpacity={0.9}
      accessibilityLabel={`${item.name}'s contact`}
      accessibilityRole="button"
      testID={`contact-match-card-${item.id}`}
    >
      <View style={styles.contactContent}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image 
              source={{ uri: item.avatar }} 
              style={styles.avatar}
              accessibilityLabel={`${item.name}'s avatar`}
              testID="contact-avatar"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.contactInfo}>
          <Text style={styles.name} testID="contact-name">{item.name}</Text>
          <Text style={styles.contactDetail}>{item.phoneNumber}</Text>
          {item.email && <Text style={styles.contactDetail}>{item.email}</Text>}
          
          {item.isRegistered && (
            <View style={styles.registeredContainer}>
              <MaterialIcons name="check-circle" size={14} color="#10B981" />
              <Text style={styles.registeredText}>Registered user</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.connectButton]}
          onPress={() => onConnect(item.id, 'connect')}
          accessibilityLabel="Connect"
          accessibilityRole="button"
          testID={`connect-button-${item.id}`}
        >
          <MaterialIcons name="person-add" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Create platform-specific shadows
const cardShadow = createShadow(3);
const buttonShadow = createShadow(2);

const styles = StyleSheet.create({
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...cardShadow,
  },
  contactContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  registeredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  registeredText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    ...buttonShadow,
  },
  connectButton: {
    backgroundColor: '#8B5CF6',
  },
});

// Use memo to prevent unnecessary re-renders
export default memo(ContactMatchCard);