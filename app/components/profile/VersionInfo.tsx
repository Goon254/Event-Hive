// app/components/profile/VersionInfo.tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface VersionInfoProps {
  version: string;
}

/**
 * Version info component
 * Displays the app version
 */
const VersionInfo: React.FC<VersionInfoProps> = ({ version }) => {
  return (
    <Text style={styles.versionText} testID="version-info">
      Version {version}
    </Text>
  );
};

const styles = StyleSheet.create({
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 20,
  }
});

export default VersionInfo;