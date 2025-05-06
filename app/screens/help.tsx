// app/screens/help.tsx
import React, { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { createShadow } from '../utils/platformUtils';
import ScreenWrapper from '../components/common/ScreenWrapper';

// AI Chat configuration
const HUGGING_FACE_API_KEY = 'YOUR_HUGGING_FACE_API_KEY'; // Replace with your API key

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

const HUGGING_FACE_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

// Define FAQ types
interface FAQItem {
  question: string;
  answer: string;
  expanded?: boolean;
}

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [faqs, setFAQs] = useState<FAQItem[]>([
    {
      question: 'How do I create an event?',
      answer: 'To create an event, go to the Create tab, fill in the event details, and tap "Create". You can add an image, specify location, set ticket prices, and configure event settings.',
    },
    {
      question: 'How does event check-in work?',
      answer: 'Each event generates a unique QR code. Attendees can show their QR code at the event entrance. Organizers can scan these codes using the QR scanner to mark attendance.',
    },
    {
      question: 'Can I transfer or cancel my event registration?',
      answer: 'Event registration policies vary. Check the specific event details for cancellation and transfer options. Some events may allow cancellations up to a certain date.',
    },
    {
      question: 'How secure is my personal information?',
      answer: 'We take data privacy seriously. Your information is encrypted and stored securely. You can manage your privacy settings in the Privacy & Security section of the app.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We support various payment methods including credit cards, PayPal, and bank transfers. You can manage your payment methods in the Payment Methods section.',
    },
  ]);

  // AI Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '0', 
      text: 'Hi there! I\'m ScanGo AI Assistant. How can I help you today?', 
      sender: 'ai' 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Toggle FAQ expansion
  const toggleFAQ = (index: number) => {
    const updatedFAQs = [...faqs];
    updatedFAQs[index].expanded = !updatedFAQs[index].expanded;
    setFAQs(updatedFAQs);
  };

  // Contact support via email
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@scangoapp.com?subject=ScanGo%20App%20Support');
  };

  // Open app website
  const handleVisitWebsite = () => {
    Linking.openURL('https://scangoapp.com');
  };

  // AI Chat Methods
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user'
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    Keyboard.dismiss();

    // Show loading
    setIsLoading(true);

    try {
      // Send request to Hugging Face API
      const response = await fetch(HUGGING_FACE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            past_user_inputs: messages
              .filter(m => m.sender === 'user')
              .map(m => m.text),
            generated_responses: messages
              .filter(m => m.sender === 'ai')
              .map(m => m.text),
            text: inputMessage
          }
        })
      });

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      const data = await response.json();
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        text: data[0]?.generated_text || 'Sorry, I couldn\'t understand that.',
        sender: 'ai'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: 'Sorry, I\'m having trouble responding right now. Please try again later.',
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, messages]);

  // Create back button for header
  const headerBackButton = (
    <TouchableOpacity
      onPress={() => router.back()}
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      style={styles.backButton}
    >
      <FontAwesome name="arrow-left" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper
      backgroundColor="#F9FAFB"
      statusBarStyle="light-content"
      header={{
        title: "Help & Support",
        rightContent: <View style={{ width: 40 }} />,
        gradientColors: ['#2563EB', '#4F46E5']
      }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Support Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          
          <View style={styles.supportOptionsContainer}>
            <TouchableOpacity 
              style={styles.supportOption}
              onPress={handleContactSupport}
            >
              <View style={[styles.supportIconContainer, { backgroundColor: '#3B82F6' }]}>
                <MaterialCommunityIcons name="email-outline" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.supportTextContainer}>
                <Text style={styles.supportOptionTitle}>Email Support</Text>
                <Text style={styles.supportOptionDescription}>
                  Contact our support team directly
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.supportOption}
              onPress={handleVisitWebsite}
            >
              <View style={[styles.supportIconContainer, { backgroundColor: '#10B981' }]}>
                <MaterialCommunityIcons name="web" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.supportTextContainer}>
                <Text style={styles.supportOptionTitle}>Visit Website</Text>
                <Text style={styles.supportOptionDescription}>
                  Learn more about ScanGo
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Frequently Asked Questions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqContainer}>
            {faqs.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity 
                  style={styles.faqHeader}
                  onPress={() => toggleFAQ(index)}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <FontAwesome 
                    name={faq.expanded ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
                
                {faq.expanded && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
        {/* AI Chat Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Assistant</Text>
          
          <TouchableOpacity 
            style={styles.supportOption}
            onPress={() => setIsChatOpen(true)}
          >
            <View style={[styles.supportIconContainer, { backgroundColor: '#8B5CF6' }]}>
              <MaterialCommunityIcons name="robot-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.supportTextContainer}>
              <Text style={styles.supportOptionTitle}>AI Help Assistant</Text>
              <Text style={styles.supportOptionDescription}>
                Get instant answers to your questions
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* AI Chat Modal */}
      {isChatOpen && (
        <View style={styles.chatModalOverlay}>
          <View style={styles.chatModal}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>ScanGo AI Assistant</Text>
              <TouchableOpacity 
                onPress={() => setIsChatOpen(false)}
                style={styles.chatCloseButton}
              >
                <FontAwesome name="times" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatMessages}
              inverted
              renderItem={({ item }) => (
                <View style={[
                  styles.chatMessageContainer,
                  item.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
                ]}>
                  <Text style={[
                    styles.chatMessageText,
                    item.sender === 'user' ? styles.userMessageText : styles.aiMessageText
                  ]}>
                    {item.text}
                  </Text>
                </View>
              )}
            />

            {/* Chat Input */}
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.chatInputContainer}
            >
              <TextInput
                style={styles.chatInput}
                value={inputMessage}
                onChangeText={setInputMessage}
                placeholder="Ask me anything about ScanGo"
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <TouchableOpacity 
                style={styles.chatSendButton}
                onPress={sendMessage}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <FontAwesome name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}

// Platform-specific shadows
const cardShadow = createShadow(2);
const buttonShadow = createShadow(1);

const styles = StyleSheet.create({
  // AI Chat Modal Styles
  chatModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  chatModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    ...cardShadow,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  chatCloseButton: {
    padding: 8,
  },
  chatMessages: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatMessageContainer: {
    marginVertical: 4,
    maxWidth: '85%',
    borderRadius: 12,
    padding: 12,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
  },
  chatMessageText: {
    fontSize: 14,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#1F2937',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  chatInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chatSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    ...cardShadow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  supportOptionsContainer: {
    gap: 12,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supportTextContainer: {
    flex: 1,
  },
  supportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  supportOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  faqContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#4B5563',
    padding: 16,
    paddingTop: 0,
    lineHeight: 22,
  },
});