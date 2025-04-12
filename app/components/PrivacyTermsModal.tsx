// app/components/PrivacyTermsModal.tsx
import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

/**
 * Privacy and Terms of Service Modal Component
 * 
 * This component displays either the Privacy Policy or Terms of Service
 * in a modal dialog. It uses the dedicated PrivacyPolicy and TermsOfService
 * components for the content.
 * 
 * @param visible - Whether the modal is visible
 * @param onClose - Function to call when the modal is closed
 * @param type - Which content to display ('privacy' or 'terms')
 */
interface PrivacyTermsModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  visible,
  onClose,
  type
}) => {
  const isPrivacy = type === 'privacy';
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} />
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContent}>
            {isPrivacy ? (
              <PrivacyPolicy />
            ) : (
              <TermsOfService />
            )}
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onClose}
            >
              <Text style={styles.acceptButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    maxHeight: '70%',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrivacyTermsModal;