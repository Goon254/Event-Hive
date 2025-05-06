import React, { ReactNode } from 'react';
import { View, StyleSheet, StatusBar, Image, ImageBackground, ViewStyle, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../theme/constants';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightContent?: ReactNode;
  leftContent?: ReactNode;
  hidden?: boolean;
  gradientColors?: string[];
}

interface ScreenWrapperProps {
  children: ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  contentContainerStyle?: ViewStyle;
  header?: HeaderProps;
  backgroundImage?: any; // Image source
  backgroundOpacity?: number;
  backgroundGradient?: {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
  };
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  backgroundColor = 'COLORS.background',
  statusBarStyle = 'light-content',
  contentContainerStyle,
  header,
  backgroundImage,
  backgroundOpacity = 1,
  backgroundGradient,
}) => {
  const insets = useSafeAreaInsets();
  const COLORS = useThemeColors();

  // If a background color is not provided, use the theme background
  const bgColor = backgroundColor === 'transparent' ? COLORS.background : backgroundColor;

  // Render background based on props
  const renderBackground = () => {
    if (backgroundGradient) {
      return (
        <LinearGradient
          colors={backgroundGradient.colors.length >= 2 ? backgroundGradient.colors as any : ['#FFFFFF', '#FFFFFF']}
          start={backgroundGradient.start || { x: 0, y: 0 }}
          end={backgroundGradient.end || { x: 0, y: 1 }}
          style={styles.backgroundGradient}
        />
      );
    }
    
    if (backgroundImage) {
      return (
        <Image
          source={backgroundImage}
          style={[styles.backgroundImage, { opacity: backgroundOpacity }]}
          resizeMode="cover"
        />
      );
    }
    
    return null;
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={statusBarStyle}
        translucent
        backgroundColor="COLORS.background"
      />
      
      {renderBackground()}
      
      {header && !header.hidden && (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          {header.gradientColors ? (
            <LinearGradient
              colors={header.gradientColors && header.gradientColors.length >= 2 ? header.gradientColors as any : ['#FFFFFF', '#FFFFFF']}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                {header.leftContent}
                <View style={styles.headerTextContainer}>
                  {header.title && <Text style={[styles.headerTitle, { color: COLORS.headerText }]}>{header.title}</Text>}
                  {header.subtitle && <Text style={[styles.headerSubtitle, { color: COLORS.headerSubtitle }]}>{header.subtitle}</Text>}
                </View>
                {header.rightContent}
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.headerContent}>
              {header.leftContent}
              <View style={styles.headerTextContainer}>
                {header.title && <Text style={[styles.headerTitle, { color: COLORS.headerText }]}>{header.title}</Text>}
                {header.subtitle && <Text style={[styles.headerSubtitle, { color: COLORS.headerSubtitle }]}>{header.subtitle}</Text>}
              </View>
              {header.rightContent}
            </View>
          )}
        </View>
      )}
      
      <View
        style={[
          styles.contentContainer,
          contentContainerStyle,
           { paddingTop: header?.hidden !== false ? insets.top : 0 },

        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  header: {
    width: '100%',
    zIndex: 10,
  },
  headerGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default ScreenWrapper;
export { ScreenWrapper };
export type { ScreenWrapperProps, HeaderProps };