// app/screens/ChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Keyboard,
  RefreshControl
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/constants';
import { createShadow } from '../utils/platformUtils';
import { useAuth } from '../AuthContext';
import { useChat } from '../services/chatService';
import { useEncryption } from '../services/encryptionService';
import { Message } from '../models/connection/types';
import ScreenLayout from '../components/common/ScreenLayout';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

/**
 * Chat Screen
 * Screen for messaging with a connection
 */
export default function ChatScreen() {
  const router = useRouter();
  const { userId, name, avatar } = useLocalSearchParams<{ userId: string; name: string; avatar: string }>();
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  // Custom hooks
  const { encryptionEnabled } = useEncryption(user as any);
  const {
    messages,
    isLoading,
    hasMoreMessages,
    loadMoreMessages,
    sendMessage,
  } = useChat(user?.id || null, userId);
  
  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Handle send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const message = await sendMessage(inputMessage, encryptionEnabled);
    
    if (message) {
      setInputMessage('');
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  };
  
  // Render message item
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.sentMessageContainer : styles.receivedMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.sentMessageBubble : styles.receivedMessageBubble
        ]}>
          {item.isEncrypted && (
            <Ionicons 
              name="lock-closed" 
              size={12} 
              color={isCurrentUser ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.5)"} 
              style={styles.encryptionIcon}
            />
          )}
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.sentMessageText : styles.receivedMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isCurrentUser ? styles.sentMessageTime : styles.receivedMessageTime
          ]}>
            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
          </Text>
          
          {/* Message status indicator */}
          {isCurrentUser && (
            <View style={styles.messageStatus}>
              {item.status === 'sent' && (
                <Ionicons name="checkmark" size={12} color="rgba(255, 255, 255, 0.7)" />
              )}
              {item.status === 'delivered' && (
                <Ionicons name="checkmark-done" size={12} color="rgba(255, 255, 255, 0.7)" />
              )}
              {item.status === 'read' && (
                <Ionicons name="checkmark-done" size={12} color="#4CAF50" />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <ScreenLayout
      backgroundColor={COLORS.background}
      statusBarColor={COLORS.primary}
      statusBarStyle="light-content"
      testID="chat-screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerProfile}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{name || 'Chat'}</Text>
            <Text style={styles.headerStatus}>
              {encryptionEnabled ? 'End-to-end encrypted' : 'Online'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.menuButton}
          accessibilityLabel="More options"
          accessibilityRole="button"
        >
          <MaterialIcons name="more-vert" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            inverted
            onEndReached={hasMoreMessages ? loadMoreMessages : undefined}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              hasMoreMessages && messages.length > 0 ? (
                <ActivityIndicator 
                  size="small" 
                  color={COLORS.primary} 
                  style={styles.loadMoreIndicator} 
                />
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={loadMoreMessages}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            }
          />
        )}
        
        {/* Input area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            accessibilityLabel="Attach file"
            accessibilityRole="button"
          >
            <MaterialIcons name="attach-file" size={24} color={COLORS.secondaryText} />
          </TouchableOpacity>
          
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.secondaryText}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            maxLength={500}
          />
          
          {encryptionEnabled && (
            <Ionicons 
              name="lock-closed" 
              size={18} 
              color={COLORS.primary} 
              style={styles.inputEncryptionIcon}
            />
          )}
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputMessage.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!inputMessage.trim()}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <MaterialIcons 
              name="send" 
              size={24} 
              color={inputMessage.trim() ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    ...createShadow(4),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerStatus: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.secondaryText,
    fontSize: 16,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
  },
  receivedMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    ...createShadow(2),
  },
  sentMessageBubble: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
  },
  receivedMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  sentMessageText: {
    color: '#FFFFFF',
  },
  receivedMessageText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 12,
  },
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  receivedMessageTime: {
    color: COLORS.secondaryText,
  },
  messageStatus: {
    position: 'absolute',
    bottom: 4,
    left: 8,
  },
  encryptionIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    ...createShadow(2),
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    maxHeight: 100,
    fontSize: 16,
    color: COLORS.text,
  },
  inputEncryptionIcon: {
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  loadMoreIndicator: {
    marginVertical: 16,
  },
});