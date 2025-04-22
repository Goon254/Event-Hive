import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/constants';
import { createShadow } from '../../utils/platformUtils';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  onSearch?: () => void;
  editable?: boolean;
  rightIcon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  placeholderColor?: string;
}

/**
 * A consistent search bar component that can be used either as a button
 * that navigates to a search screen or as an actual input field.
 */
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onPress,
  onSearch,
  editable = true,
  rightIcon,
  backgroundColor = '#FFFFFF',
  textColor = COLORS.text,
  placeholderColor = COLORS.secondaryText,
}) => {
  // Determine if this is a button or an input field
  const isButton = !!onPress && !editable;

  return (
    <View style={styles.container}>
      {isButton ? (
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor }]}
          activeOpacity={0.8}
          onPress={onPress}
        >
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={20} color={placeholderColor} />
          </View>
          <Text style={[styles.searchText, { color: placeholderColor }]}>
            {placeholder}
          </Text>
          {rightIcon || (
            <View style={styles.arrowContainer}>
              <MaterialIcons name="arrow-forward" size={20} color={COLORS.primary} />
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.searchBar, { backgroundColor }]}>
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={20} color={placeholderColor} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            returnKeyType="search"
            onSubmitEditing={onSearch}
          />
          {value.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => onChangeText?.('')}
            >
              <Ionicons name="close-circle" size={18} color={placeholderColor} />
            </TouchableOpacity>
          )}
          {rightIcon}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...createShadow(1),
  },
  searchIconContainer: {
    marginRight: 10,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    height: 24,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
});

export default SearchBar;