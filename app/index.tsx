// app/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Platform,
  ImageBackground,
  Animated,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// Optional: Use ScrollView as fallback if PagerView isn't available
// import PagerView from 'react-native-pager-view';
import { BlurView } from 'expo-blur';

export default function LandingPage() {
  // State to control splash screen visibility
  const [showSplash, setShowSplash] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Reference to the scroll view
  const pagerRef = useRef<ScrollView>(null);
  
  // Handle splash screen animations
  useEffect(() => {
    // Animate splash screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ]).start();
    
    // After 2.5 seconds, fade out splash and show main content
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
        // Once splash is gone, fade in main content
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Run animations when main screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (!showSplash) {
        // Start animations for main content
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
      }
      
      return () => {
        // Reset animations when screen loses focus
        if (!showSplash) {
          fadeAnim.setValue(0);
          slideAnim.setValue(50);
        }
      };
    }, [showSplash])
  );
  
  // Render splash screen
  if (showSplash) {
    return (
      <ImageBackground
        source={require('../assets/images/tropical-gradient.png')}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(0, 191, 166, 0.7)', 'rgba(252, 211, 77, 0.8)']} // Teal to yellow gradient
          style={styles.gradient}
        >
          <StatusBar style="light" />
          <Animated.View 
            style={[
              styles.splashContainer,
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {/* Animated icon instead of Lottie */}
            <Animated.View 
              style={[styles.animatedLogoContainer, {
                transform: [
                  { rotate: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  }) }
                ]
              }]}
            >
              <MaterialIcons name="event" size={80} color="#00BFA6" /> // Tropical teal
            </Animated.View>
            
            <Image
              source={require('../assets/images/eventhive-icon.png')}
              style={styles.splashLogo}
              resizeMode="contain"
            />
            <Text style={styles.splashTitle}>Event-Hive</Text>
            <Text style={styles.splashTagline}>Your Tropical Event Paradise</Text>
            
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => {
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 500,
                  useNativeDriver: true,
                }).start(() => setShowSplash(false));
              }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </ImageBackground>
    );
  }
  
  // Main content with pager
  return (
    <ImageBackground
      source={require('../assets/images/tropical-gradient.png')}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(0, 191, 166, 0.7)', 'rgba(252, 211, 77, 0.8)']} // Teal to yellow gradient
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          
          <Animated.View style={[styles.mainContainer, { opacity: fadeAnim }]}>
            {/* ScrollView as a fallback for PagerView */}
            <ScrollView 
              style={styles.pagerView}
              pagingEnabled={true}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              ref={pagerRef}
            >
              {/* Page 1: Brand Introduction */}
              <View style={styles.page} key="1">
                <View style={styles.headerContainer}>
                  <View style={styles.logoContainer}>
                    <Image
                      source={require('../assets/images/eventhive-icon.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.logo}>Event-Hive</Text>
                  <Text style={styles.tagline}>Your Tropical Event Paradise</Text>
                  
                  <BlurView intensity={20} tint="dark" style={styles.descriptionContainer}>
                    <Text style={styles.descriptionTitle}>Your Island of Events</Text>
                    <Text style={styles.descriptionText}>
                      Relax and enjoy Event-Hive's tropical experience. Create and manage events with ease,
                      scan QR codes for breezy check-ins, and connect with fellow islanders in paradise.
                    </Text>
                  </BlurView>
                </View>
                
                <NextPageButton onPress={() => {
                  // Scroll to next page
                  pagerRef.current?.scrollTo({ x: width, animated: true });
                }} />
              </View>
              
              {/* Page 2: Features */}
              <View style={styles.page} key="2">
                <Text style={styles.pageTitle}>Key Features</Text>
                
                <View style={styles.featuresContainer}>
                  <FeatureCard
                    icon={<MaterialIcons name="qr-code-scanner" size={32} color="#FFFFFF" />}
                    title="Breezy Check-in"
                    description="Scan QR codes for a relaxed, hassle-free entry experience"
                    delay={200}
                  />

                  <FeatureCard
                    icon={<MaterialIcons name="analytics" size={32} color="#FFFFFF" />}
                    title="Island Insights"
                    description="Watch your event paradise grow with real-time analytics"
                    delay={400}
                  />

                  <FeatureCard
                    icon={<MaterialIcons name="notifications" size={32} color="#FFFFFF" />}
                    title="Ocean Waves"
                    description="Let notifications gently remind you of upcoming events"
                    delay={600}
                  />
                </View>
                
                <NextPageButton onPress={() => {
                  // Scroll to next page
                  pagerRef.current?.scrollTo({ x: width * 2, animated: true });
                }} />
              </View>
              
              {/* Page 3: Call to Action */}
              <View style={styles.page} key="3">
                <Text style={styles.pageTitle}>Get Started</Text>
                
                <BlurView intensity={40} tint="dark" style={styles.glassCard}>
                  <Text style={styles.actionTitle}>Ready to join our tropical paradise?</Text>
                  
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
                  
                  <View style={styles.socialAuthContainer}>
                    <TouchableOpacity 
                      style={styles.googleButton}
                      onPress={() => console.log('Google Sign In')}
                    >
                      <FontAwesome name="google" size={20} color="#FFFFFF" />
                      <Text style={styles.socialButtonText}>Sign In with Google</Text>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </View>
            </ScrollView>
            
            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              {[0, 1, 2].map((index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.paginationDot,
                    { backgroundColor: index === 0 ? '#00BFA6' : 'rgba(255, 255, 255, 0.5)' } // Tropical teal
                  ]}
                  onPress={() => pagerRef.current?.scrollTo({ x: width * index, animated: true })}
                />
              ))}
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

// Next Page Button Component
const NextPageButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.nextButton} onPress={onPress}>
    <MaterialIcons name="keyboard-arrow-down" size={32} color="#FFFFFF" />
  </TouchableOpacity>
);

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
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
      <BlurView intensity={30} tint="dark" style={styles.featureContent}>
        <View style={styles.featureIconContainer}>
          {icon}
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{description}</Text>
      </BlurView>
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
  mainContainer: {
    flex: 1,
  },
  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  animatedLogoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 191, 166, 0.5)', // Tropical teal with transparency
  },
  splashLogo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  splashTagline: {
    fontSize: 22,
    color: '#A0AEC0',
    marginBottom: 50,
  },
  continueButton: {
    backgroundColor: '#00BFA6', // Tropical teal
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 40,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Pager Styles
  pagerView: {
    flex: 1,
  },
  page: {
    width: Dimensions.get('window').width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 5,
  },
  nextButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 191, 166, 0.3)', // Tropical teal with transparency
    padding: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 166, 0.7)', // Tropical teal with transparency
  },
  // Header Styles
  headerContainer: {
    alignItems: 'center',
    width: '100%',
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
  // Glassmorphism Styles
  descriptionContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
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
  // Feature Styles
  featuresContainer: {
    width: '100%',
    marginBottom: 30,
  },
  featureItem: {
    width: '100%',
    marginBottom: 20,
  },
  featureContent: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  featureIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 191, 166, 0.3)', // Tropical teal with transparency
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 166, 0.5)', // Tropical teal with transparency
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
  // CTA Glass Card Styles
  glassCard: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  actionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#00BFA6', // Tropical teal
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
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
    borderColor: '#00BFA6', // Tropical teal
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00BFA6', // Tropical teal
  },
  // Social Auth Styles
  socialAuthContainer: {
    width: '100%',
    marginTop: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2DD4BF', // Lighter teal
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },

});