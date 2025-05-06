// components/common/SearchBar.tsx (Luxury Tropical Version)

import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  editable?: boolean;
  premium?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search',
  value,
  onChangeText,
  onPress,
  editable = true,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={editable ? 1 : 0.8}
      onPress={!editable && onPress ? onPress : undefined}
      style={styles.container}
    >
      <Ionicons name="search" size={20} color="#6B7280" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        pointerEvents={editable ? 'auto' : 'none'}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    marginHorizontal: 24,
    marginBottom: 20,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
});

export default SearchBar;