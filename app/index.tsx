// app/index.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  ImageBackground,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function LandingPage() {
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  
  // Run animations when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
      
      return () => {
        // Reset animations when screen loses focus
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
      };
    }, [])
  );
  
  return (
    <ImageBackground
      source={require('../assets/images/react-logo.png')}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(26, 32, 44, 0.95)']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Animated Header/Logo Section */}
            <Animated.View
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.logo}>Event-Hive</Text>
              <Text style={styles.tagline}>Scan, Attend, Connect</Text>
            </Animated.View>

            {/* App Description */}
            <Animated.View
              style={[
                styles.descriptionContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.descriptionTitle}>Simplify Event Management</Text>
              <Text style={styles.descriptionText}>
                Event-Hive helps you create and manage events with ease. Use QR codes for seamless check-ins,
                track attendance, and connect with participants all in one place.
              </Text>
            </Animated.View>

            {/* Feature Highlights */}
            <View style={styles.featuresContainer}>
              <FeatureCard
                icon={<MaterialIcons name="qr-code-scanner" size={32} color="#FFFFFF" />}
                title="Easy Check-in"
                description="Scan QR codes for quick and secure event check-ins"
                delay={200}
                fadeAnim={fadeAnim}
                slideAnim={slideAnim}
              />

              <FeatureCard
                icon={<MaterialIcons name="analytics" size={32} color="#FFFFFF" />}
                title="Track Attendance"
                description="Real-time attendance tracking and analytics"
                delay={400}
                fadeAnim={fadeAnim}
                slideAnim={slideAnim}
              />

              <FeatureCard
                icon={<MaterialIcons name="notifications" size={32} color="#FFFFFF" />}
                title="Stay Updated"
                description="Get notifications for your upcoming events"
                delay={600}
                fadeAnim={fadeAnim}
                slideAnim={slideAnim}
              />
            </View>

            {/* Action Buttons */}
            <Animated.View
              style={[
                styles.actionContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.actionTitle}>Ready to get started?</Text>
              
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity style={styles.loginButton}>
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
              </Link>
              
              <Text style={styles.orText}>or</Text>
              
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity style={styles.registerButton}>
                  <Text style={styles.registerButtonText}>Create an Account</Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>
            
            {/* Social Proof Section */}
            <View style={styles.socialProofContainer}>
              <Text style={styles.socialProofTitle}>Trusted by Event Organizers</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>500+</Text>
                  <Text style={styles.statLabel}>Events</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>10k+</Text>
                  <Text style={styles.statLabel}>Users</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>98%</Text>
                  <Text style={styles.statLabel}>Satisfaction</Text>
                </View>
              </View>
            </View>
            
            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>© 2025 Event-Hive. All rights reserved.</Text>
              <View style={styles.socialLinks}>
                <TouchableOpacity style={styles.socialIcon}>
                  <FontAwesome name="facebook" size={20} color="#A0AEC0" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <FontAwesome name="twitter" size={20} color="#A0AEC0" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <FontAwesome name="instagram" size={20} color="#A0AEC0" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay, fadeAnim, slideAnim }) => {
  const cardFadeAnim = React.useRef(new Animated.Value(0)).current;
  const cardSlideAnim = React.useRef(new Animated.Value(30)).current;
  
  React.useEffect(() => {
    // Delayed animation for each card
    const animation = Animated.parallel([
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 800,
        delay,
        useNativeDriver: true,
      })
    ]);
    
    animation.start();
    
    return () => {
      animation.stop();
      cardFadeAnim.setValue(0);
      cardSlideAnim.setValue(30);
    };
  }, [delay]);
  
  return (
    <Animated.View
      style={[
        styles.featureItem,
        {
          opacity: cardFadeAnim,
          transform: [{ translateY: cardSlideAnim }]
        }
      ]}
    >
      <View style={styles.featureIconContainer}>
        {icon}
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{description}</Text>
    </Animated.View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#A0AEC0',
    marginBottom: 20,
  },
  descriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  descriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: '#E2E8F0',
    lineHeight: 24,
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginBottom: 30,
  },
  featureItem: {
    width: width > 600 ? '30%' : '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: width > 600 ? 0 : 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  featureIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.5)',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 15,
    color: '#CBD5E0',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 40,
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orText: {
    fontSize: 16,
    color: '#A0AEC0',
    marginVertical: 14,
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  socialProofContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  socialProofTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 4,
  },
  footer: {
    marginHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#A0AEC0',
    marginBottom: 16,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
});