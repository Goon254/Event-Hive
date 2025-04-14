import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Feature flag system for controlling feature rollout
 * Allows enabling/disabling features without code changes
 */

// Feature flag types
export type FeatureFlag = 
  | 'DEBUG_COMPONENTS' 
  | 'NEW_EVENT_PRIVACY' 
  | 'OPTIMISTIC_UPDATES'
  | 'ENHANCED_MEDIA_UPLOAD'
  | 'SERVER_SIDE_FILTERING'
  | 'STANDARDIZED_DATE_HANDLING';

// Feature flag configuration interface
interface FeatureFlagConfig {
  [key: string]: {
    defaultValue: boolean;
    description: string;
    group: 'debug' | 'ui' | 'performance' | 'data' | 'media';
  }
}

// Default configuration for all feature flags
const featureFlagDefaults: FeatureFlagConfig = {
  DEBUG_COMPONENTS: {
    defaultValue: false,
    description: 'Show debug components in the UI',
    group: 'debug'
  },
  NEW_EVENT_PRIVACY: {
    defaultValue: true,
    description: 'Enable new privacy controls for events',
    group: 'ui'
  },
  OPTIMISTIC_UPDATES: {
    defaultValue: true,
    description: 'Enable optimistic UI updates',
    group: 'performance'
  },
  ENHANCED_MEDIA_UPLOAD: {
    defaultValue: true,
    description: 'Enable enhanced media upload with validation and compression',
    group: 'media'
  },
  SERVER_SIDE_FILTERING: {
    defaultValue: true,
    description: 'Use server-side filtering instead of client-side',
    group: 'performance'
  },
  STANDARDIZED_DATE_HANDLING: {
    defaultValue: true,
    description: 'Use standardized date handling utilities',
    group: 'data'
  }
};

// Feature flags context interface
interface FeatureFlagsContextType {
  flags: Record<FeatureFlag, boolean>;
  loading: boolean;
  isEnabled: (flag: FeatureFlag) => boolean;
  toggleFlag: (flag: FeatureFlag) => Promise<void>;
  setFlag: (flag: FeatureFlag, value: boolean) => Promise<void>;
  resetFlags: () => Promise<void>;
}


// Storage key for feature flags
const STORAGE_KEY = 'featureFlags';

/**
 * Hook to use feature flags
 * @returns Feature flags utilities
 */
export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>({} as Record<FeatureFlag, boolean>);
  const [loading, setLoading] = useState(true);
  
  // Load flags from storage on mount
  useEffect(() => {
    const loadFlags = async () => {
      try {
        const storedFlags = await AsyncStorage.getItem(STORAGE_KEY);
        const parsedFlags = storedFlags ? JSON.parse(storedFlags) : {};
        
        // Merge with defaults
        const mergedFlags = Object.keys(featureFlagDefaults).reduce((acc, flag) => {
          const typedFlag = flag as FeatureFlag;
          acc[typedFlag] = parsedFlags[flag] !== undefined
            ? parsedFlags[flag]
            : featureFlagDefaults[flag].defaultValue;
          return acc;
        }, {} as Record<FeatureFlag, boolean>);
        
        setFlags(mergedFlags);
      } catch (error) {
        console.error('Error loading feature flags:', error);
        // Fall back to defaults
        setFlags(Object.keys(featureFlagDefaults).reduce((acc, flag) => {
          const typedFlag = flag as FeatureFlag;
          acc[typedFlag] = featureFlagDefaults[flag].defaultValue;
          return acc;
        }, {} as Record<FeatureFlag, boolean>));
      } finally {
        setLoading(false);
      }
    };
    
    loadFlags();
  }, []);
  
  // Check if a flag is enabled
  const isEnabled = (flag: FeatureFlag): boolean => {
    return flags[flag] === true;
  };
  
  // Toggle a flag
  const toggleFlag = async (flag: FeatureFlag): Promise<void> => {
    try {
      const newFlags = { ...flags, [flag]: !flags[flag] };
      setFlags(newFlags);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFlags));
    } catch (error) {
      console.error('Error toggling feature flag:', error);
    }
  };
  
  // Set a flag to a specific value
  const setFlag = async (flag: FeatureFlag, value: boolean): Promise<void> => {
    try {
      const newFlags = { ...flags, [flag]: value };
      setFlags(newFlags);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFlags));
    } catch (error) {
      console.error('Error setting feature flag:', error);
    }
  };
  
  // Reset all flags to defaults
  const resetFlags = async (): Promise<void> => {
    try {
      const defaultFlags = Object.keys(featureFlagDefaults).reduce((acc, flag) => {
        const typedFlag = flag as FeatureFlag;
        acc[typedFlag] = featureFlagDefaults[flag].defaultValue;
        return acc;
      }, {} as Record<FeatureFlag, boolean>);
      
      setFlags(defaultFlags);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFlags));
    } catch (error) {
      console.error('Error resetting feature flags:', error);
    }
  };
  
  return {
    flags,
    loading,
    isEnabled,
    toggleFlag,
    setFlag,
    resetFlags
  };
};

/**
 * Get feature flag configuration
 * @returns Feature flag configuration
 */
export const getFeatureFlagConfig = (): FeatureFlagConfig => {
  return featureFlagDefaults;
};

/**
 * Check if a feature flag is enabled
 * Utility function for non-React code
 * @param flag Feature flag to check
 * @returns Promise that resolves to boolean indicating if flag is enabled
 */
export const isFeatureEnabled = async (flag: FeatureFlag): Promise<boolean> => {
  try {
    const storedFlags = await AsyncStorage.getItem(STORAGE_KEY);
    const parsedFlags = storedFlags ? JSON.parse(storedFlags) : {};
    
    return parsedFlags[flag] !== undefined
      ? parsedFlags[flag]
      : featureFlagDefaults[flag].defaultValue;
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return featureFlagDefaults[flag].defaultValue;
  }
};