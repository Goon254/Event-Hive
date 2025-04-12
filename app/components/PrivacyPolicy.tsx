// app/components/PrivacyPolicy.tsx
import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';

/**
 * Privacy Policy Component
 * 
 * This component displays the app's privacy policy in a scrollable format.
 * It's used in the PrivacyTermsModal component and can be reused elsewhere.
 * 
 * The content follows standard privacy policy requirements for apps using
 * Google Sign-In and location services.
 */
const PrivacyPolicy: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last Updated: April 11, 2025</Text>
        
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to ScanGo ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience when using our application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.
        </Text>
        <Text style={styles.paragraph}>
          By using ScanGo, you agree to the collection and use of information in accordance with this policy. We will not use or share your information with anyone except as described in this Privacy Policy.
        </Text>
        
        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect several types of information for various purposes to provide and improve our service to you:
        </Text>
        
        <Text style={styles.subSectionTitle}>2.1 Personal Information</Text>
        <Text style={styles.paragraph}>
          When you register for an account, we may collect:
        </Text>
        <Text style={styles.bulletPoint}>• Name</Text>
        <Text style={styles.bulletPoint}>• Email address</Text>
        <Text style={styles.bulletPoint}>• Phone number (optional)</Text>
        <Text style={styles.bulletPoint}>• Profile picture</Text>
        <Text style={styles.bulletPoint}>• Location information (city and country)</Text>
        
        <Text style={styles.subSectionTitle}>2.2 Authentication Information</Text>
        <Text style={styles.paragraph}>
          When you sign in with Google or other third-party authentication providers, we may receive:
        </Text>
        <Text style={styles.bulletPoint}>• Your name and email address from the provider</Text>
        <Text style={styles.bulletPoint}>• Profile picture from the provider</Text>
        <Text style={styles.bulletPoint}>• Unique identifier from the provider</Text>
        <Text style={styles.paragraph}>
          We do not receive or store your passwords for third-party authentication services.
        </Text>
        
        <Text style={styles.subSectionTitle}>2.3 Location Information</Text>
        <Text style={styles.paragraph}>
          With your permission, we may collect precise location information to:
        </Text>
        <Text style={styles.bulletPoint}>• Help you find nearby events</Text>
        <Text style={styles.bulletPoint}>• Provide location-based features</Text>
        <Text style={styles.bulletPoint}>• Improve our services</Text>
        <Text style={styles.paragraph}>
          You can disable location services through your device settings, but this may limit certain features of our application.
        </Text>
        
        <Text style={styles.subSectionTitle}>2.4 Usage Information</Text>
        <Text style={styles.paragraph}>
          We collect information about how you use our application, including:
        </Text>
        <Text style={styles.bulletPoint}>• Log data (IP address, browser type, pages visited)</Text>
        <Text style={styles.bulletPoint}>• Device information (hardware model, operating system)</Text>
        <Text style={styles.bulletPoint}>• App usage statistics</Text>
        
        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect to:
        </Text>
        <Text style={styles.bulletPoint}>• Provide, maintain, and improve our services</Text>
        <Text style={styles.bulletPoint}>• Process transactions and send related information</Text>
        <Text style={styles.bulletPoint}>• Send you technical notices, updates, and support messages</Text>
        <Text style={styles.bulletPoint}>• Respond to your comments and questions</Text>
        <Text style={styles.bulletPoint}>• Personalize your experience</Text>
        <Text style={styles.bulletPoint}>• Monitor usage of our services</Text>
        <Text style={styles.bulletPoint}>• Detect, prevent, and address technical issues</Text>
        
        <Text style={styles.sectionTitle}>4. Sharing of Information</Text>
        <Text style={styles.paragraph}>
          We may share your information with:
        </Text>
        <Text style={styles.bulletPoint}>• Service providers who perform services on our behalf</Text>
        <Text style={styles.bulletPoint}>• Event organizers when you register for their events</Text>
        <Text style={styles.bulletPoint}>• Other users as part of your public profile</Text>
        <Text style={styles.bulletPoint}>• Law enforcement when required by law</Text>
        <Text style={styles.paragraph}>
          We will not sell your personal information to third parties.
        </Text>
        
        <Text style={styles.sectionTitle}>5. Google Sign-In</Text>
        <Text style={styles.paragraph}>
          When you sign in with Google, our use of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements. This means we will:
        </Text>
        <Text style={styles.bulletPoint}>• Only request access to the data we need</Text>
        <Text style={styles.bulletPoint}>• Only use the data for the purposes you've consented to</Text>
        <Text style={styles.bulletPoint}>• Not sell the data</Text>
        <Text style={styles.bulletPoint}>• Not use the data for advertising purposes without your consent</Text>
        <Text style={styles.bulletPoint}>• Not mislead you about how we use the data</Text>
        
        <Text style={styles.sectionTitle}>6. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
        </Text>
        
        <Text style={styles.sectionTitle}>7. Your Rights</Text>
        <Text style={styles.paragraph}>
          Depending on your location, you may have certain rights regarding your personal information, including:
        </Text>
        <Text style={styles.bulletPoint}>• Access to your personal information</Text>
        <Text style={styles.bulletPoint}>• Correction of inaccurate information</Text>
        <Text style={styles.bulletPoint}>• Deletion of your information</Text>
        <Text style={styles.bulletPoint}>• Restriction of processing</Text>
        <Text style={styles.bulletPoint}>• Data portability</Text>
        <Text style={styles.bulletPoint}>• Objection to processing</Text>
        
        <Text style={styles.sectionTitle}>8. Revoking Access</Text>
        <Text style={styles.paragraph}>
          You can revoke our access to your Google account information at any time by:
        </Text>
        <Text style={styles.bulletPoint}>• Visiting https://myaccount.google.com/permissions</Text>
        <Text style={styles.bulletPoint}>• Finding ScanGo in the list of apps</Text>
        <Text style={styles.bulletPoint}>• Clicking "Remove Access"</Text>
        <Text style={styles.paragraph}>
          You can also delete your account from within our app, which will remove all your personal information from our servers.
        </Text>
        
        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our service is not directed to anyone under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13 without verification of parental consent, we will take steps to remove that information from our servers.
        </Text>
        
        <Text style={styles.sectionTitle}>10. Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
        </Text>
        <Text style={styles.paragraph}>
          You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
        </Text>
        
        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us at:
        </Text>
        <Text style={styles.bulletPoint}>• Email: privacy@scango.com</Text>
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
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#374151',
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

export default PrivacyPolicy;