import { useRef, useEffect } from 'react';
import { InteractionManager, View, Text } from 'react-native';
import React from 'react';

/**
 * Performance monitoring utilities
 * Provides tools for tracking component renders, interaction timing,
 * and UI responsiveness
 */

/**
 * Hook to track component renders
 * @param componentName Name of the component to track
 */
export const useRenderTracking = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    renderCount.current += 1;
    
    console.log(
      `[PERF] ${componentName} rendered #${renderCount.current} ` +
      `(+${timeSinceLastRender}ms since last render)`
    );
    
    lastRenderTime.current = now;
    
    // Check for frequent re-renders
    if (renderCount.current > 5 && timeSinceLastRender < 100) {
      console.warn(
        `[PERF WARNING] ${componentName} is re-rendering frequently! ` +
        `Consider using React.memo or optimizing dependencies.`
      );
    }
  });
  
  return {
    getRenderCount: () => renderCount.current
  };
};

/**
 * Track interaction timing
 * @param name Name of the interaction to track
 * @param callback Async function to execute and time
 * @returns Promise that resolves to the result of the callback
 */
export const trackInteraction = async <T>(
  name: string, 
  callback: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  console.log(`[PERF] Starting interaction: ${name}`);
  
  try {
    // Run the callback
    const result = await callback();
    
    // Log completion time
    const duration = Date.now() - startTime;
    console.log(`[PERF] Completed interaction: ${name} in ${duration}ms`);
    
    // Check for slow interactions
    if (duration > 500) {
      console.warn(`[PERF WARNING] Slow interaction: ${name} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PERF] Failed interaction: ${name} after ${duration}ms`, error);
    throw error;
  }
};

/**
 * Track UI responsiveness after operations
 * @param operationName Name of the operation to track
 */
export const trackUIResponsiveness = (operationName: string) => {
  const startTime = Date.now();
  
  InteractionManager.runAfterInteractions(() => {
    const duration = Date.now() - startTime;
    console.log(`[PERF] UI responsive after ${operationName} in ${duration}ms`);
    
    if (duration > 1000) {
      console.warn(`[PERF WARNING] UI blocked for ${duration}ms after ${operationName}`);
    }
  });
};

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  componentRenders: Record<string, number>;
  interactions: Record<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
    maxDuration: number;
  }>;
  uiBlockingEvents: {
    count: number;
    totalDuration: number;
    averageDuration: number;
  };
}

// Global performance metrics
const metrics: PerformanceMetrics = {
  componentRenders: {},
  interactions: {},
  uiBlockingEvents: {
    count: 0,
    totalDuration: 0,
    averageDuration: 0
  }
};

/**
 * Record component render
 * @param componentName Name of the component
 */
export const recordComponentRender = (componentName: string) => {
  if (!metrics.componentRenders[componentName]) {
    metrics.componentRenders[componentName] = 0;
  }
  metrics.componentRenders[componentName]++;
};

/**
 * Record interaction
 * @param name Name of the interaction
 * @param duration Duration in milliseconds
 */
export const recordInteraction = (name: string, duration: number) => {
  if (!metrics.interactions[name]) {
    metrics.interactions[name] = {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
      maxDuration: 0
    };
  }
  
  const interaction = metrics.interactions[name];
  interaction.count++;
  interaction.totalDuration += duration;
  interaction.averageDuration = interaction.totalDuration / interaction.count;
  interaction.maxDuration = Math.max(interaction.maxDuration, duration);
};

/**
 * Record UI blocking event
 * @param duration Duration in milliseconds
 */
export const recordUIBlockingEvent = (duration: number) => {
  metrics.uiBlockingEvents.count++;
  metrics.uiBlockingEvents.totalDuration += duration;
  metrics.uiBlockingEvents.averageDuration = 
    metrics.uiBlockingEvents.totalDuration / metrics.uiBlockingEvents.count;
};

/**
 * Get performance metrics
 * @returns Current performance metrics
 */
export const getPerformanceMetrics = (): PerformanceMetrics => {
  return { ...metrics };
};

/**
 * Reset performance metrics
 */
export const resetPerformanceMetrics = () => {
  metrics.componentRenders = {};
  metrics.interactions = {};
  metrics.uiBlockingEvents = {
    count: 0,
    totalDuration: 0,
    averageDuration: 0
  };
};

/**
 * Enhanced version of useEffect that tracks performance
 * @param effect Effect callback
 * @param deps Dependencies array
 * @param name Optional name for the effect
 */
export const useTrackedEffect = (
  effect: () => void | (() => void),
  deps: any[],
  name: string = 'unnamed effect'
) => {
  useEffect(() => {
    const startTime = Date.now();
    console.log(`[PERF] Starting effect: ${name}`);
    
    const cleanup = effect();
    
    const duration = Date.now() - startTime;
    console.log(`[PERF] Effect ${name} executed in ${duration}ms`);
    
    if (duration > 100) {
      console.warn(`[PERF WARNING] Slow effect: ${name} took ${duration}ms`);
    }
    
    return cleanup;
  }, deps);
};

/**
 * Default export component for performance utilities
 * This component is exported to satisfy route requirements
 */
const PerformanceUtilities: React.FC = () => {
  return React.createElement(
    View,
    { style: { flex: 1, justifyContent: 'center', alignItems: 'center' } },
    React.createElement(Text, null, "Performance Utilities")
  );
};

export default PerformanceUtilities;