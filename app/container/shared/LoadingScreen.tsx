// app/container/shared/LoadingScreen.tsx
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export const LoadingScreen = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});

export default LoadingScreen;
