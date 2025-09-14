// components/ThemedText.tsx
import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  // Safely get color with fallback
  let color;
  try {
    color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  } catch (error) {
    console.warn('Error in useThemeColor:', error);
    color = '#000000'; // Fallback to black
  }

  // Create a safe styles array
  const styleArray = [{ color }];
  
  // Only add defined styles
  if (type === 'default' && styles.default) styleArray.push({ ...styles.default, color });
  if (type === 'title' && styles.title) styleArray.push({ ...styles.title, color });
  if (type === 'defaultSemiBold' && styles.defaultSemiBold) styleArray.push({ ...styles.defaultSemiBold, color });
  if (type === 'subtitle' && styles.subtitle) styleArray.push({ ...styles.subtitle, color });
  if (type === 'link' && styles.link) styleArray.push({ ...styles.link, color });
  
  // Add custom style if defined
  if (style) {
    const flattenedStyle = StyleSheet.flatten(style);
    styleArray.push({ ...flattenedStyle, color: String(flattenedStyle.color ?? color) });
  }

  return (
    <Text
      style={styleArray}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});