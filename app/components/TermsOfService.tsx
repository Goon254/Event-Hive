// app/components/TermsOfService.tsx
import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';

/**
 * Terms of Service Component
 * 
 * This component displays the app's terms of service in a scrollable format.
 * It's used in the PrivacyTermsModal component and can be reused elsewhere.
 * 
 * The content follows standard terms of service requirements for apps using
 * Google Sign-In and location services.
 */
const TermsOfService: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last Updated: April 11, 2025</Text>
        
        <Text style={styles.paragraph}>
          Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the ScanGo mobile application (the "Service") operated by ScanGo, Inc. ("us", "we", or "our").
        </Text>
        <Text style={styles.paragraph}>
          Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.
        </Text>
        <Text style={styles.paragraph}>
          By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
        </Text>
        
        <Text style={styles.sectionTitle}>1. Accounts</Text>
        <Text style={styles.paragraph}>
          When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </Text>
        <Text style={styles.paragraph}>
          You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
        </Text>
        <Text style={styles.paragraph}>
          You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
        </Text>
        
        <Text style={styles.sectionTitle}>2. Google Sign-In</Text>
        <Text style={styles.paragraph}>
          Our Service offers the option to sign in using your Google account. By using Google Sign-In, you agree to:
        </Text>
        <Text style={styles.bulletPoint}>• Comply with Google's Terms of Service</Text>
        <Text style={styles.bulletPoint}>• Allow us to access the information you've agreed to share</Text>
        <Text style={styles.bulletPoint}>• Understand that we will store and use this information in accordance with our Privacy Policy</Text>
        <Text style={styles.paragraph}>
          You can revoke our access to your Google account at any time by visiting your Google account settings.
        </Text>
        
        <Text style={styles.sectionTitle}>3. Content</Text>
        <Text style={styles.paragraph}>
          Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
        </Text>
        <Text style={styles.paragraph}>
          By posting Content on or through the Service, you represent and warrant that:
        </Text>
        <Text style={styles.bulletPoint}>• The Content is yours (you own it) or you have the right to use it and grant us the rights and license as provided in these Terms.</Text>
        <Text style={styles.bulletPoint}>• The posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person.</Text>
        
        <Text style={styles.sectionTitle}>4. Location Services</Text>
        <Text style={styles.paragraph}>
          Our Service may request access to your device's location services. By enabling location services for our app, you agree that:
        </Text>
        <Text style={styles.bulletPoint}>• We may collect and process information about your precise or approximate location</Text>
        <Text style={styles.bulletPoint}>• We will use this information as described in our Privacy Policy</Text>
        <Text style={styles.bulletPoint}>• You can withdraw your consent at any time by disabling location services for our app in your device settings</Text>
        
        <Text style={styles.sectionTitle}>5. Prohibited Uses</Text>
        <Text style={styles.paragraph}>
          You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
        </Text>
        <Text style={styles.bulletPoint}>• In any way that violates any applicable national or international law or regulation.</Text>
        <Text style={styles.bulletPoint}>• For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</Text>
        <Text style={styles.bulletPoint}>• To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</Text>
        <Text style={styles.bulletPoint}>• To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</Text>
        <Text style={styles.bulletPoint}>• In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful.</Text>
        <Text style={styles.bulletPoint}>• To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which may harm the Company or users of the Service.</Text>
        
        <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of ScanGo, Inc. and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of ScanGo, Inc.
        </Text>
        
        <Text style={styles.sectionTitle}>7. Termination</Text>
        <Text style={styles.paragraph}>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </Text>
        <Text style={styles.paragraph}>
          Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or delete your account within the app.
        </Text>
        
        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          In no event shall ScanGo, Inc., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </Text>
        <Text style={styles.bulletPoint}>• Your access to or use of or inability to access or use the Service;</Text>
        <Text style={styles.bulletPoint}>• Any conduct or content of any third party on the Service;</Text>
        <Text style={styles.bulletPoint}>• Any content obtained from the Service; and</Text>
        <Text style={styles.bulletPoint}>• Unauthorized access, use or alteration of your transmissions or content.</Text>
        
        <Text style={styles.sectionTitle}>9. Disclaimer</Text>
        <Text style={styles.paragraph}>
          Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
        </Text>
        <Text style={styles.paragraph}>
          ScanGo, Inc., its subsidiaries, affiliates, and its licensors do not warrant that:
        </Text>
        <Text style={styles.bulletPoint}>• The Service will function uninterrupted, secure or available at any particular time or location;</Text>
        <Text style={styles.bulletPoint}>• Any errors or defects will be corrected;</Text>
        <Text style={styles.bulletPoint}>• The Service is free of viruses or other harmful components; or</Text>
        <Text style={styles.bulletPoint}>• The results of using the Service will meet your requirements.</Text>
        
        <Text style={styles.sectionTitle}>10. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
        </Text>
        <Text style={styles.paragraph}>
          Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
        </Text>
        
        <Text style={styles.sectionTitle}>11. Changes</Text>
        <Text style={styles.paragraph}>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        </Text>
        <Text style={styles.paragraph}>
          By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
        </Text>
        
        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at:
        </Text>
        <Text style={styles.bulletPoint}>• Email: terms@scango.com</Text>
        <Text style={styles.bulletPoint}>• Address: 123 Main Street, Anytown, USA 12345</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: '#1F2937',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
    color: '#4B5563',
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 8,
    color: '#4B5563',
  },
});

export default TermsOfService;