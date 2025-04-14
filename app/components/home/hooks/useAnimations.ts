import { useRef, useCallback, useMemo } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';

/**
 * Custom hook for managing animations in the Home screen
 * Extracts animation logic from the component for better separation of concerns
 * Optimized to prevent unnecessary re-renders
 */
export const useAnimations = (maxItems: number = 20) => {
  // Cache window dimensions to avoid recalculating on each render
  const windowHeight = useRef(Dimensions.get('window').height).current;
  // Main animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const exploreModalTranslateY = useRef(new Animated.Value(windowHeight)).current;
  
  // Animation pool for list items
  const itemAnimations = useRef<{
    fadeAnim: Animated.Value[],
    translateY: Animated.Value[]
  }>({
    fadeAnim: Array(maxItems).fill(0).map(() => new Animated.Value(0)),
    translateY: Array(maxItems).fill(0).map(() => new Animated.Value(20))
  });

  // Function to animate list items
  const animateListItems = useCallback((count: number) => {
    const animations: Animated.CompositeAnimation[] = [];
    
    for (let i = 0; i < count; i++) {
      if (i < itemAnimations.current.fadeAnim.length) {
        const delay = i * 50;
        animations.push(
          Animated.timing(itemAnimations.current.fadeAnim[i], {
            toValue: 1,
            duration: 300,
            delay,
            useNativeDriver: true,
          })
        );
        animations.push(
          Animated.timing(itemAnimations.current.translateY[i], {
            toValue: 0,
            duration: 300,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          })
        );
      }
    }
    
    Animated.parallel(animations).start();
  }, []);

  // Function to animate content appearance
  const animateContentAppearance = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, translateY]);

  // Function to show explore modal with animation
  const showExploreModal = useCallback(() => {
    Animated.timing(exploreModalTranslateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start();
  }, [exploreModalTranslateY]);

  // Function to hide explore modal with animation
  const hideExploreModal = useCallback((onComplete?: () => void) => {
    Animated.timing(exploreModalTranslateY, {
      toValue: windowHeight,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease)
    }).start(() => {
      onComplete?.();
    });
  }, [exploreModalTranslateY, windowHeight]);

  // Get animation values for a specific item
  const getItemAnimationValues = useCallback((index: number) => {
    const fadeValue = index < itemAnimations.current.fadeAnim.length 
      ? itemAnimations.current.fadeAnim[index] 
      : new Animated.Value(1);
    
    const translateValue = index < itemAnimations.current.translateY.length 
      ? itemAnimations.current.translateY[index] 
      : new Animated.Value(0);
    
    return { fadeValue, translateValue };
  }, []);

  // Memoize the return value to prevent unnecessary object recreation on each render
  return useMemo(() => ({
    // Animation values
    fadeAnim,
    translateY,
    exploreModalTranslateY,
    
    // Animation functions
    animateListItems,
    animateContentAppearance,
    showExploreModal,
    hideExploreModal,
    getItemAnimationValues
  }), [
    fadeAnim,
    translateY,
    exploreModalTranslateY,
    animateListItems,
    animateContentAppearance,
    showExploreModal,
    hideExploreModal,
    getItemAnimationValues
  ]);
};